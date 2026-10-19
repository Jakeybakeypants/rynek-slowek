#include "RynekTown.h"
#include "RynekWidgets.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/WidgetComponent.h"
#include "Components/InputComponent.h"
#include "Components/BoxComponent.h"
#include "Engine/GameInstance.h"
#include "Engine/StaticMesh.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "Animation/AnimationAsset.h"
#include "Materials/MaterialInterface.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "Camera/PlayerCameraManager.h"
#include "Kismet/GameplayStatics.h"
#include "InputCoreTypes.h"

DEFINE_LOG_CATEGORY_STATIC(LogRynekTown, Log, All);

namespace
{
	FLinearColor Hex(const FString& H, const FLinearColor& Fallback)
	{
		return H.StartsWith(TEXT("#")) ? FLinearColor(FColor::FromHex(H)) : Fallback;
	}
}

ARynekTown::ARynekTown()
{
	PrimaryActorTick.bCanEverTick = true;
	RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	// the Third Person template's mannequin; if the project doesn't have it, people are cylinders
	PersonMesh = TSoftObjectPtr<USkeletalMesh>(FSoftObjectPath(TEXT("/Game/Characters/Mannequins/Meshes/SKM_Quinn_Simple.SKM_Quinn_Simple")));
	IdleAnimation = TSoftObjectPtr<UAnimationAsset>(FSoftObjectPath(TEXT("/Game/Characters/Mannequins/Anims/Unarmed/MM_Idle.MM_Idle")));
}

FVector ARynekTown::ToWorld(float X, float Y, float Z) const
{
	const FVector V(X, bMirror ? -Y : Y, Z);
	return TownOrigin + V.RotateAngleAxis(TownTurn, FVector::UpVector);
}

float ARynekTown::ToYaw(float Yaw) const
{
	return (bMirror ? -Yaw : Yaw) + TownTurn;
}

void ARynekTown::BeginPlay()
{
	Super::BeginPlay();
	UGameInstance* GI = GetGameInstance();
	Words = GI ? GI->GetSubsystem<URynekWords>() : nullptr;
	if (!Words) return;
	Align();
	// an invisible floor under the whole town, so you can walk even if the imported town has no collision
	Ground = NewObject<UBoxComponent>(this);
	Ground->SetupAttachment(RootComponent);
	Ground->SetBoxExtent(FVector(40000.f, 40000.f, 10.f));
	Ground->SetCollisionProfileName(TEXT("BlockAll"));
	Ground->SetHiddenInGame(true);
	Ground->RegisterComponent();
	Ground->SetWorldLocation(TownOrigin - FVector(0.f, 0.f, 10.f));
	Build();
	LanguageHandle = Words->OnLanguageChanged.AddUObject(this, &ARynekTown::Build);
	StatusHandle = Words->OnStatusChanged.AddUObject(this, &ARynekTown::RefreshLabels);

	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC) return;
	if (bMovePlayerToStart)
		if (APawn* Pawn = PC->GetPawn())
		{
			// where the web game starts you: in front of the fountain, looking at it
			const FVector Start = ToWorld(0.f, 1950.f, 0.f) + FVector(0.f, 0.f, 100.f);
			const FRotator Facing(0.f, ToYaw(-90.f), 0.f);
			Pawn->SetActorLocationAndRotation(Start, Facing, false, nullptr, ETeleportType::TeleportPhysics);
			PC->SetControlRotation(Facing);
		}
	EnableInput(PC);
	if (InputComponent)
	{
		InputComponent->BindKey(EKeys::E, IE_Pressed, this, &ARynekTown::OnTalk);
		InputComponent->BindKey(EKeys::Tab, IE_Pressed, this, &ARynekTown::OnNextWord);
		InputComponent->BindKey(EKeys::One, IE_Pressed, this, &ARynekTown::OnSortNew);
		InputComponent->BindKey(EKeys::Two, IE_Pressed, this, &ARynekTown::OnSortLearning);
		InputComponent->BindKey(EKeys::Three, IE_Pressed, this, &ARynekTown::OnSortKnown);
		InputComponent->BindKey(EKeys::Q, IE_Pressed, this, &ARynekTown::OnLeave);
		InputComponent->BindKey(EKeys::L, IE_Pressed, this, &ARynekTown::OnLanguage);
	}
	Dialogue = CreateWidget<URynekDialogueWidget>(PC, URynekDialogueWidget::StaticClass());
	if (Dialogue) Dialogue->AddToViewport(10);
	if (GEngine) GEngine->AddOnScreenDebugMessage(-1, 10.f, FColor::White, TEXT("Rynek Słówek: walk up to someone and press E. L changes language."));
}

void ARynekTown::EndPlay(const EEndPlayReason::Type Reason)
{
	if (Words)
	{
		Words->OnLanguageChanged.Remove(LanguageHandle);
		Words->OnStatusChanged.Remove(StatusHandle);
	}
	Super::EndPlay(Reason);
}

void ARynekTown::Align()
{
	if (!bAutoAlign) return;
	// people and items stand on the ground; a wrong turn puts many of them on roofs or in the air
	TArray<FVector2D> Points;
	for (const auto& P : Words->Characters) Points.Add(FVector2D(P.Value.X, P.Value.Y));
	for (const auto& P : Words->Items) Points.Add(FVector2D(P.Value.HomeX, P.Value.HomeY));
	FCollisionQueryParams Params(SCENE_QUERY_STAT(RynekAlign), true, this);
	if (const APlayerController* PC = GetWorld()->GetFirstPlayerController())
		if (APawn* Pawn = PC->GetPawn()) Params.AddIgnoredActor(Pawn);

	const float SetTurn = TownTurn;
	const bool bSetMirror = bMirror;
	int32 Best = -1, BestHits = 0;
	float BestTurn = SetTurn;
	bool bBestMirror = bSetMirror;
	for (int32 M = 0; M < 2; ++M)
		for (int32 T = 0; T < 4; ++T)
		{
			TownTurn = -90.f + 90.f * T;
			bMirror = M == 1;
			int32 OnGround = 0, Hits = 0;
			for (const FVector2D& P : Points)
			{
				const FVector W = ToWorld(P.X, P.Y, 0.f);
				FHitResult Hit;
				if (!GetWorld()->LineTraceSingleByChannel(Hit, W + FVector(0, 0, 5000), W - FVector(0, 0, 2000), ECC_Visibility, Params)) continue;
				++Hits;
				if (Hit.ImpactPoint.Z - TownOrigin.Z < 80.f) ++OnGround;
			}
			const bool bSetting = FMath::IsNearlyEqual(FRotator::NormalizeAxis(TownTurn), FRotator::NormalizeAxis(SetTurn)) && bMirror == bSetMirror;
			if (OnGround > Best || (OnGround == Best && bSetting)) { Best = OnGround; BestHits = Hits; BestTurn = TownTurn; bBestMirror = bMirror; }
		}
	if (BestHits == 0)
	{
		// nothing to trace against (the town has no collision, or isn't in this level)
		TownTurn = SetTurn; bMirror = bSetMirror;
		UE_LOG(LogRynekTown, Warning, TEXT("Auto Align found no ground to stand on; using Town Turn %.0f, Mirror %d"), TownTurn, bMirror);
		return;
	}
	TownTurn = BestTurn; bMirror = bBestMirror;
	UE_LOG(LogRynekTown, Log, TEXT("Auto Align: Town Turn %.0f, Mirror %d (%d of %d on the ground)"), TownTurn, bMirror, Best, Points.Num());
}

UWidgetComponent* ARynekTown::AddWidget(const FVector& Where, const FString& Text, int32 Status)
{
	UWidgetComponent* W = NewObject<UWidgetComponent>(this);
	W->SetupAttachment(RootComponent);
	W->SetWidgetSpace(EWidgetSpace::Screen);
	W->SetDrawAtDesiredSize(true);
	W->SetWidgetClass(URynekWordWidget::StaticClass());
	W->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	W->RegisterComponent();
	W->SetWorldLocation(Where);
	W->InitWidget();
	if (URynekWordWidget* Label = Cast<URynekWordWidget>(W->GetUserWidgetObject())) Label->Show(Text, Status);
	Spawned.Add(W);
	return W;
}

void ARynekTown::Clear()
{
	for (UActorComponent* C : Spawned) if (C) C->DestroyComponent();
	Spawned.Reset();
	People.Reset();
	WorldLabels.Reset();
}

void ARynekTown::Build()
{
	Clear();
	OnLeave();
	USkeletalMesh* Mesh = PersonMesh.LoadSynchronous();
	UAnimationAsset* Idle = IdleAnimation.LoadSynchronous();
	UStaticMesh* Cylinder = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
	UMaterialInterface* Shape = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));

	for (const auto& Pair : Words->Characters)
	{
		const FRynekCharacter& C = Pair.Value;
		const bool bAnimal = C.Kind == TEXT("cat") || C.Kind == TEXT("dog");
		const float Size = C.Kind == TEXT("child") ? 0.75f : 1.f;
		const FVector Where = ToWorld(C.X, C.Y, C.Z);
		if (Mesh && !bAnimal)
		{
			USkeletalMeshComponent* S = NewObject<USkeletalMeshComponent>(this);
			S->SetupAttachment(RootComponent);
			S->SetSkeletalMeshAsset(Mesh);
			S->SetCollisionEnabled(ECollisionEnabled::NoCollision);
			S->RegisterComponent();
			// the mannequin faces +Y, so turn it a quarter to face along its yaw
			S->SetWorldLocationAndRotation(Where, FRotator(0.f, ToYaw(C.Yaw) - 90.f, 0.f));
			S->SetWorldScale3D(FVector(Size * C.Scale));
			if (Idle) S->PlayAnimation(Idle, true);
			Spawned.Add(S);
		}
		else if (Cylinder)
		{
			UStaticMeshComponent* S = NewObject<UStaticMeshComponent>(this);
			S->SetupAttachment(RootComponent);
			S->SetStaticMesh(Cylinder);
			S->RegisterComponent();
			const float H = bAnimal ? 0.45f : 1.7f * Size;
			S->SetWorldLocation(Where + FVector(0.f, 0.f, 50.f * H));
			S->SetWorldScale3D(FVector(bAnimal ? 0.35f : 0.5f, bAnimal ? 0.35f : 0.5f, H));
			if (Shape)
				if (UMaterialInstanceDynamic* Mat = UMaterialInstanceDynamic::Create(Shape, this))
				{
					Mat->SetVectorParameterValue(TEXT("Color"), Hex(C.Shirt, FLinearColor(0.5f, 0.45f, 0.4f)));
					S->SetMaterial(0, Mat);
				}
			Spawned.Add(S);
		}
		const float TagHeight = bAnimal ? 80.f : 205.f * Size;
		FPerson P;
		P.Id = Pair.Key;
		P.Where = Where;
		P.Tag = AddWidget(Where + FVector(0.f, 0.f, TagHeight), C.DisplayName, -1);
		People.Add(P);
	}

	for (const auto& Pair : Words->Items)
	{
		if (!Cube) break;
		const FRynekItem& I = Pair.Value;
		UStaticMeshComponent* S = NewObject<UStaticMeshComponent>(this);
		S->SetupAttachment(RootComponent);
		S->SetStaticMesh(Cube);
		S->SetCollisionEnabled(ECollisionEnabled::NoCollision);
		S->RegisterComponent();
		S->SetWorldLocation(ToWorld(I.HomeX, I.HomeY, I.HomeZ) + FVector(0.f, 0.f, 15.f));
		S->SetWorldScale3D(FVector(0.25f));
		if (Shape)
			if (UMaterialInstanceDynamic* Mat = UMaterialInstanceDynamic::Create(Shape, this))
			{
				Mat->SetVectorParameterValue(TEXT("Color"), FLinearColor(FColor::FromHex(TEXT("#E9B53B"))));
				S->SetMaterial(0, Mat);
			}
		Spawned.Add(S);
	}

	for (const FRynekLabel& L : Words->Labels)
	{
		FWorldLabel W;
		W.Text = L.Word;
		W.bSign = L.Kind == TEXT("sign");
		W.Where = ToWorld(L.X, L.Y, L.Z);
		W.Widget = AddWidget(W.Where, L.Word, Words->GetStatus(L.Word));
		WorldLabels.Add(W);
	}
	UE_LOG(LogRynekTown, Log, TEXT("Placed %d people, %d items, %d labels (%s)"), People.Num(), Words->Items.Num(), WorldLabels.Num(), *Words->GetLanguage());
}

void ARynekTown::RefreshLabels()
{
	for (const FWorldLabel& L : WorldLabels)
		if (L.Widget)
			if (URynekWordWidget* W = Cast<URynekWordWidget>(L.Widget->GetUserWidgetObject())) W->Show(L.Text, Words->GetStatus(L.Text));
}

void ARynekTown::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	const APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC || !PC->PlayerCameraManager) return;
	const FVector Eye = PC->PlayerCameraManager->GetCameraLocation();
	for (const FWorldLabel& L : WorldLabels)
		if (L.Widget) L.Widget->SetVisibility(FVector::Dist(Eye, L.Where) < LabelDistance * (L.bSign ? 1.6f : 1.f));
	for (const FPerson& P : People)
		if (P.Tag) P.Tag->SetVisibility(FVector::Dist(Eye, P.Where) < LabelDistance);
}

void ARynekTown::OnTalk()
{
	if (Dialogue && Dialogue->IsShown())
	{
		if (++LineIndex >= Queue.Num()) OnLeave();
		else { SelectedWord = 0; ShowCurrent(); }
		return;
	}
	const APlayerController* PC = GetWorld()->GetFirstPlayerController();
	const APawn* Pawn = PC ? PC->GetPawn() : nullptr;
	if (!Pawn) return;
	const FPerson* Nearest = nullptr;
	float NearestDist = TalkDistance;
	for (const FPerson& P : People)
	{
		const float D = FVector::Dist2D(Pawn->GetActorLocation(), P.Where);
		if (D < NearestDist) { NearestDist = D; Nearest = &P; }
	}
	if (!Nearest) return;
	TalkingTo = Nearest->Id;
	// first their introduction, then a new conversation on each visit (errands come next)
	Queue.Reset();
	if (!Introduced.Contains(TalkingTo)) { Queue = Words->GetLines(TalkingTo, TEXT("intro")); Introduced.Add(TalkingTo); }
	if (Queue.Num() == 0)
	{
		const int32 Chat = Words->NextChat(TalkingTo);
		if (Chat >= 0) Queue = Words->GetLines(TalkingTo, TEXT("chat"), Chat);
	}
	if (Queue.Num() == 0) Queue = Words->GetLines(TalkingTo, TEXT("intro"));
	LineIndex = 0;
	SelectedWord = 0;
	ShowCurrent();
}

void ARynekTown::ShowCurrent()
{
	if (!Dialogue || !Queue.IsValidIndex(LineIndex)) return;
	const FRynekCharacter* C = Words->Characters.Find(TalkingTo);
	const FRynekDialogueLine& L = Queue[LineIndex];
	Dialogue->ShowLine(C ? C->DisplayName : TalkingTo, Words->Tokenize(L.Text), L.English, SelectedWord, Words);
}

void ARynekTown::OnNextWord()
{
	if (!Dialogue || !Dialogue->IsShown() || !Queue.IsValidIndex(LineIndex)) return;
	int32 Count = 0;
	for (const FRynekToken& T : Words->Tokenize(Queue[LineIndex].Text)) if (T.bWord) ++Count;
	SelectedWord = Count > 0 ? (SelectedWord + 1) % Count : 0;
	ShowCurrent();
}

void ARynekTown::Sort(int32 Status)
{
	if (!Dialogue || !Dialogue->IsShown() || !Queue.IsValidIndex(LineIndex)) return;
	int32 Index = 0;
	for (const FRynekToken& T : Words->Tokenize(Queue[LineIndex].Text))
		if (T.bWord && Index++ == SelectedWord) { Words->SetStatus(T.Key, Status); break; }
	ShowCurrent();
}

void ARynekTown::OnLeave()
{
	if (Dialogue) Dialogue->Hide();
	Queue.Reset();
	TalkingTo.Reset();
}

void ARynekTown::OnLanguage()
{
	const TArray<FString> All = URynekWords::Languages();
	const int32 Here = All.IndexOfByKey(Words->GetLanguage());
	const FString Next = All[(Here + 1) % All.Num()];
	if (Words->SetLanguage(Next) && GEngine)
		GEngine->AddOnScreenDebugMessage(-1, 4.f, FColor::White, FString::Printf(TEXT("Language: %s"), *Next));
}
