// Drop one "Rynek Town" into a level that has the imported town (unreal/Scene/rynek-town.glb) and
// press Play: it places every character, item and word label where the web game has them, moves
// the player to the start, and lets you talk. Walk up to someone and press E.
//
//   E    talk, next line           Tab  pick the next word in the line
//   1 2 3  sort that word: new, learning, known (the colours update everywhere)
//   Q    leave the conversation    L    switch language (Polish, German, Spanish, French)
//
// Everyone is a stand-in for now: the Third Person template's mannequin if the project has it,
// otherwise a coloured cylinder. Swap in your own models by changing Person Mesh, or replace the
// stand-ins entirely; positions and ids come from the data (URynekWords).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "RynekWords.h"
#include "RynekTown.generated.h"

class UWidgetComponent;
class UBoxComponent;
class USkeletalMesh;
class UAnimationAsset;
class URynekDialogueWidget;

UCLASS(meta = (DisplayName = "Rynek Town"))
class RYNEKSLOWEK_API ARynekTown : public AActor
{
	GENERATED_BODY()
public:
	ARynekTown();

	// On Play, try the ways the town could have been turned on import and keep the one where most
	// people stand on the ground rather than on a roof. Turn this off to use Town Turn and Mirror as set.
	UPROPERTY(EditAnywhere, Category = "Rynek|Placement") bool bAutoAlign = true;
	// Degrees around Z from the data's axes to the imported town's.
	UPROPERTY(EditAnywhere, Category = "Rynek|Placement") float TownTurn = -90.f;
	UPROPERTY(EditAnywhere, Category = "Rynek|Placement") bool bMirror = false;
	// Where the web game's origin (the fountain) is in this level.
	UPROPERTY(EditAnywhere, Category = "Rynek|Placement") FVector TownOrigin = FVector::ZeroVector;
	UPROPERTY(EditAnywhere, Category = "Rynek|Placement") bool bMovePlayerToStart = true;

	UPROPERTY(EditAnywhere, Category = "Rynek|Look") TSoftObjectPtr<USkeletalMesh> PersonMesh;
	UPROPERTY(EditAnywhere, Category = "Rynek|Look") TSoftObjectPtr<UAnimationAsset> IdleAnimation;
	// Labels further than this from the camera are hidden (signs at 1.6 times this).
	UPROPERTY(EditAnywhere, Category = "Rynek|Look") float LabelDistance = 2600.f;
	UPROPERTY(EditAnywhere, Category = "Rynek|Talk") float TalkDistance = 320.f;

protected:
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type Reason) override;
	virtual void Tick(float DeltaSeconds) override;

private:
	struct FPerson { FString Id; FVector Where; UWidgetComponent* Tag = nullptr; };
	struct FWorldLabel { FString Text; FVector Where; bool bSign = false; UWidgetComponent* Widget = nullptr; };
	TArray<FPerson> People;
	TArray<FWorldLabel> WorldLabels;
	UPROPERTY() TArray<TObjectPtr<UActorComponent>> Spawned;
	UPROPERTY() TObjectPtr<URynekDialogueWidget> Dialogue;
	UPROPERTY() TObjectPtr<URynekWords> Words;
	UPROPERTY() TObjectPtr<UBoxComponent> Ground;

	FString TalkingTo;
	TArray<FRynekDialogueLine> Queue;
	int32 LineIndex = 0;
	int32 SelectedWord = 0;
	TSet<FString> Introduced;
	FDelegateHandle LanguageHandle, StatusHandle;

	FVector ToWorld(float X, float Y, float Z) const;
	float ToYaw(float Yaw) const;
	void Align();
	void Build();
	void Clear();
	void RefreshLabels();
	UWidgetComponent* AddWidget(const FVector& Where, const FString& Text, int32 Status);
	void ShowCurrent();
	void OnTalk();
	void OnNextWord();
	void OnSortNew() { Sort(0); }
	void OnSortLearning() { Sort(1); }
	void OnSortKnown() { Sort(2); }
	void Sort(int32 Status);
	void OnLeave();
	void OnLanguage();
};
