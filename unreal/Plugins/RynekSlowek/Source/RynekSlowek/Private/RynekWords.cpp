#include "RynekWords.h"
#include "Interfaces/IPluginManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "JsonObjectConverter.h"
#include "Templates/Function.h"
#include "Kismet/GameplayStatics.h"

DEFINE_LOG_CATEGORY_STATIC(LogRynek, Log, All);

namespace
{
	const TCHAR* SettingsSlot = TEXT("Rynek_settings");

	// letters of the four languages (Latin-1 and Latin Extended), without relying on the C locale
	bool IsLetter(TCHAR C)
	{
		if ((C >= 'a' && C <= 'z') || (C >= 'A' && C <= 'Z')) return true;
		if (C >= 0xC0 && C <= 0x24F) return C != 0xD7 && C != 0xF7;
		return C > 0x24F && FChar::IsAlpha(C);
	}

	// lower case for the same letters; FString::ToLower can leave Ł, Ż or É alone on some platforms
	TCHAR Lower(TCHAR C)
	{
		if (C >= 'A' && C <= 'Z') return TCHAR(C + 32);
		if (C >= 0xC0 && C <= 0xDE && C != 0xD7) return TCHAR(C + 32);
		if ((C >= 0x100 && C <= 0x137) || (C >= 0x14A && C <= 0x177)) return (C % 2 == 0) ? TCHAR(C + 1) : C;
		if ((C >= 0x139 && C <= 0x148) || (C >= 0x179 && C <= 0x17E)) return (C % 2 == 1) ? TCHAR(C + 1) : C;
		if (C == 0x178) return TCHAR(0xFF);
		return FChar::ToLower(C);
	}

	FString LowerString(const FString& S)
	{
		FString Out = S;
		for (TCHAR& C : Out) C = Lower(C);
		return Out;
	}

	template <typename T>
	void ReadRows(const TSharedPtr<FJsonObject>& Root, const TCHAR* Table, TFunctionRef<void(const FString&, T&)> Add)
	{
		const TArray<TSharedPtr<FJsonValue>>* Rows = nullptr;
		if (!Root->TryGetArrayField(Table, Rows)) { UE_LOG(LogRynek, Warning, TEXT("rynek-data.json has no %s table"), Table); return; }
		for (const TSharedPtr<FJsonValue>& V : *Rows)
		{
			const TSharedPtr<FJsonObject> O = V->AsObject();
			if (!O.IsValid()) continue;
			T Row;
			if (!FJsonObjectConverter::JsonObjectToUStruct(O.ToSharedRef(), &Row)) continue;
			Add(O->GetStringField(TEXT("Name")), Row);
		}
	}
}

void URynekWords::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	FString Lang = TEXT("pl");
	if (const URynekSave* S = Cast<URynekSave>(UGameplayStatics::LoadGameFromSlot(SettingsSlot, 0)))
		if (Languages().Contains(S->Language)) Lang = S->Language;
	SetLanguage(Lang);
}

bool URynekWords::SetLanguage(const FString& Lang)
{
	const TSharedPtr<IPlugin> Plugin = IPluginManager::Get().FindPlugin(TEXT("RynekSlowek"));
	if (!Plugin.IsValid()) return false;
	const FString Path = FPaths::Combine(Plugin->GetBaseDir(), TEXT("Data"), Lang, TEXT("rynek-data.json"));
	FString Json;
	if (!FFileHelper::LoadFileToString(Json, *Path)) { UE_LOG(LogRynek, Error, TEXT("Can't read %s"), *Path); return false; }
	TSharedPtr<FJsonObject> Root;
	if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Json), Root) || !Root.IsValid()) { UE_LOG(LogRynek, Error, TEXT("%s is not valid JSON"), *Path); return false; }

	Language = Lang;
	WordForms.Reset(); Lines.Reset(); Characters.Reset(); Items.Reset(); Labels.Reset();
	ReadRows<FRynekWordForm>(Root, TEXT("WordForms"), [this](const FString& Name, FRynekWordForm& Row) { WordForms.Add(LowerString(Name), Row); });
	ReadRows<FRynekCharacter>(Root, TEXT("Characters"), [this](const FString& Name, FRynekCharacter& Row) { Characters.Add(Name, Row); });
	ReadRows<FRynekItem>(Root, TEXT("Items"), [this](const FString& Name, FRynekItem& Row) { Items.Add(Name, Row); });
	ReadRows<FRynekLabel>(Root, TEXT("Labels"), [this](const FString&, FRynekLabel& Row) { Labels.Add(Row); });
	ReadRows<FRynekDialogueLine>(Root, TEXT("Dialogue"), [this](const FString&, FRynekDialogueLine& Row)
	{
		Lines.FindOrAdd(FString::Printf(TEXT("%s|%s|%d"), *Row.Character, *Row.Section, Row.Conversation)).Add(Row);
	});
	for (auto& Pair : Lines) Pair.Value.Sort([](const FRynekDialogueLine& A, const FRynekDialogueLine& B) { return A.Line < B.Line; });
	UE_LOG(LogRynek, Log, TEXT("Loaded %s: %d word forms, %d characters, %d items, %d labels"), *Lang, WordForms.Num(), Characters.Num(), Items.Num(), Labels.Num());

	LoadSave();
	URynekSave* Settings = NewObject<URynekSave>(this);
	Settings->Language = Lang;
	UGameplayStatics::SaveGameToSlot(Settings, SettingsSlot, 0);
	OnLanguageChanged.Broadcast();
	return true;
}

TArray<FRynekToken> URynekWords::Tokenize(const FString& Line) const
{
	TArray<FRynekToken> Out;
	const bool bFrench = Language == TEXT("fr");
	int32 I = 0;
	const int32 N = Line.Len();
	auto Push = [&Out](const FString& Text, bool bWord)
	{
		FRynekToken T; T.Text = Text; T.bWord = bWord; if (bWord) T.Key = LowerString(Text);
		Out.Add(T);
	};
	while (I < N)
	{
		if (!IsLetter(Line[I]))
		{
			const int32 Start = I;
			while (I < N && !IsLetter(Line[I])) ++I;
			Push(Line.Mid(Start, I - Start), false);
			continue;
		}
		const int32 Start = I;
		while (I < N && IsLetter(Line[I])) ++I;
		if (bFrench)
		{
			// peut-être, est-ce, va-t-il: hyphens between letters stay inside the word
			while (I + 1 < N && Line[I] == '-' && IsLetter(Line[I + 1])) { ++I; while (I < N && IsLetter(Line[I])) ++I; }
			// aujourd'hui is one word; otherwise an apostrophe before a letter ends an elided word (c', qu')
			const bool bApostrophe = I + 1 < N && (Line[I] == '\'' || Line[I] == 0x2019) && IsLetter(Line[I + 1]);
			if (bApostrophe && LowerString(Line.Mid(Start, I - Start)).EndsWith(TEXT("aujourd")) && LowerString(Line.Mid(I + 1, 3)) == TEXT("hui")) I += 4;
			else if (bApostrophe) ++I;
		}
		Push(Line.Mid(Start, I - Start).Replace(TEXT("\u2019"), TEXT("'")), true);
	}
	return Out;
}

bool URynekWords::Lookup(const FString& Form, FRynekWordForm& Out) const
{
	if (const FRynekWordForm* W = WordForms.Find(LowerString(Form))) { Out = *W; return true; }
	return false;
}

int32 URynekWords::GetStatus(const FString& Form) const
{
	const int32* S = Save ? Save->Status.Find(LowerString(Form)) : nullptr;
	return S ? *S : 0;
}

void URynekWords::SetStatus(const FString& Form, int32 Status)
{
	if (!Save) return;
	Save->Status.Add(LowerString(Form), FMath::Clamp(Status, 0, 2));
	WriteSave();
	OnStatusChanged.Broadcast();
}

FLinearColor URynekWords::StatusColor(int32 Status)
{
	// the web game's light-theme colours: purple new, orange learning, green known
	switch (Status)
	{
	case 2: return FLinearColor(FColor::FromHex(TEXT("#1C8748")));
	case 1: return FLinearColor(FColor::FromHex(TEXT("#C95A04")));
	default: return FLinearColor(FColor::FromHex(TEXT("#7638D3")));
	}
}

TArray<FRynekDialogueLine> URynekWords::GetLines(const FString& Character, const FString& Section, int32 Conversation) const
{
	const TArray<FRynekDialogueLine>* L = Lines.Find(FString::Printf(TEXT("%s|%s|%d"), *Character, *Section, Conversation));
	return L ? *L : TArray<FRynekDialogueLine>();
}

int32 URynekWords::NextChat(const FString& Character)
{
	const FRynekCharacter* C = Characters.Find(Character);
	if (!C || C->ChatCount <= 0 || !Save) return -1;
	int32& Heard = Save->ChatsHeard.FindOrAdd(Character);
	const int32 Index = Heard % C->ChatCount;
	++Heard;
	WriteSave();
	return Index;
}

void URynekWords::LoadSave()
{
	Save = Cast<URynekSave>(UGameplayStatics::LoadGameFromSlot(TEXT("Rynek_") + Language, 0));
	if (!Save) Save = NewObject<URynekSave>(this);
}

void URynekWords::WriteSave()
{
	if (Save) UGameplayStatics::SaveGameToSlot(Save, TEXT("Rynek_") + Language, 0);
}
