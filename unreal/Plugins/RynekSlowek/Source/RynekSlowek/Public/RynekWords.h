// The game's words and lines for the language being learned, and how well the player knows each
// written form. One per game instance: GetGameInstance()->GetSubsystem<URynekWords>().
//
// It reads the plugin's Data/<language>/rynek-data.json (written by tools/export-unreal.mjs), so
// nothing has to be imported into the Content Browser. Progress is saved per language, in the
// save slot "Rynek_<language>", keyed by lower-case written form, as the web game does.
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "GameFramework/SaveGame.h"
#include "RynekDataTypes.h"
#include "RynekWords.generated.h"

// 0 new (purple), 1 learning (orange), 2 known (green)
UCLASS()
class RYNEKSLOWEK_API URynekSave : public USaveGame
{
	GENERATED_BODY()
public:
	UPROPERTY() TMap<FString, int32> Status;
	UPROPERTY() TMap<FString, int32> ChatsHeard;   // character id -> how many conversations they have had
	UPROPERTY() FString Language;                  // only used in the "Rynek_settings" slot: the language last played
};

// One piece of a line: a word (looked up and coloured) or the spaces and punctuation between words.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekToken
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) FString Text;
	UPROPERTY(BlueprintReadOnly) bool bWord = false;
	UPROPERTY(BlueprintReadOnly) FString Key;      // lower-case form, what status is stored under
};

UCLASS()
class RYNEKSLOWEK_API URynekWords : public UGameInstanceSubsystem
{
	GENERATED_BODY()
public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	// pl, de, es or fr. Loads that language's data and progress; false if its file is missing.
	UFUNCTION(BlueprintCallable, Category = "Rynek") bool SetLanguage(const FString& Lang);
	UFUNCTION(BlueprintPure, Category = "Rynek") FString GetLanguage() const { return Language; }
	UFUNCTION(BlueprintPure, Category = "Rynek") static TArray<FString> Languages() { return { TEXT("pl"), TEXT("de"), TEXT("es"), TEXT("fr") }; }

	// Split a line the way the web game does (French keeps c' and peut-être as the frequency list counts them).
	UFUNCTION(BlueprintPure, Category = "Rynek") TArray<FRynekToken> Tokenize(const FString& Line) const;
	UFUNCTION(BlueprintPure, Category = "Rynek") bool Lookup(const FString& Form, FRynekWordForm& Out) const;

	UFUNCTION(BlueprintPure, Category = "Rynek") int32 GetStatus(const FString& Form) const;
	UFUNCTION(BlueprintCallable, Category = "Rynek") void SetStatus(const FString& Form, int32 Status);
	UFUNCTION(BlueprintPure, Category = "Rynek") static FLinearColor StatusColor(int32 Status);

	// The lines of one section, in order: Section is intro, done, chat... (see FRynekDialogueLine).
	UFUNCTION(BlueprintPure, Category = "Rynek") TArray<FRynekDialogueLine> GetLines(const FString& Character, const FString& Section, int32 Conversation = 0) const;
	int32 NextChat(const FString& Character);   // which chat this character says next, counting it as heard

	TMap<FString, FRynekCharacter> Characters;  // by id (jozef, ola...)
	TMap<FString, FRynekItem> Items;            // by id (okulary, mleko...)
	TArray<FRynekLabel> Labels;

	// Fired after the language changes, so labels and names can update.
	DECLARE_MULTICAST_DELEGATE(FOnRynekChanged);
	FOnRynekChanged OnLanguageChanged;
	FOnRynekChanged OnStatusChanged;

private:
	FString Language;
	TMap<FString, FRynekWordForm> WordForms;
	TMap<FString, TArray<FRynekDialogueLine>> Lines;   // "character|section|conversation"
	UPROPERTY() TObjectPtr<URynekSave> Save;
	void LoadSave();
	void WriteSave();
};
