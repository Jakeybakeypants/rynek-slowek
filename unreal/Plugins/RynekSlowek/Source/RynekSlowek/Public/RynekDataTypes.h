// Row structs for the game's data, exported by tools/export-unreal.mjs into Data/<language>/
// (CSV files plus rynek-data.json). Each field name matches a CSV column, so the CSVs also import
// as Data Tables if you want them as assets. The plugin itself reads rynek-data.json (URynekWords).
//
// Positions are in centimetres, Unreal axes (Z up). Yaw is in degrees. Colours are
// "#RRGGBB" strings: FColor::FromHex(Row.Shirt) turns one into a colour.
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataTable.h"
#include "RynekDataTypes.generated.h"

// One written form, the unit the player learns (keyed by lower-case form, as the game saves it).
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekWordForm : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Lemma;        // dictionary form it belongs to
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;      // the lemma's meaning
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Form;         // what this form is ("genitive: after bez"); empty for the lemma itself
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString PartOfSpeech;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Note;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 FrequencyRank = 0; // 1 = most common; 0 = outside the top 3000
};

// The dictionary: one row per lemma.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekWord : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString PartOfSpeech;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Note;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 FrequencyRank = 0;
};

// Inflected forms: row name is the form, pointing at its lemma.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekForm : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Lemma;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Form;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 FrequencyRank = 0;
};

USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekPhrase : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Text;           // in the language being learned
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;
};

// The top 3000 list (FrequencyWords by Hermit Dave, OpenSubtitles 2018, CC BY-SA 4.0).
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekFrequency : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 Rank = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Form;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool InGame = false;
};

USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekCharacter : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString DisplayName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Role;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Kind;          // adult, child, cat, dog
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float X = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Y = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Z = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Yaw = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Scale = 1;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Shirt;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Pants;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Hair;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString HairStyle;     // space-separated piece names from people.glb
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Hat;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString HatColor;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Moustache;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool Glasses = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Apron;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Skirt;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Bag;           // backpack or satchel
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString BagColor;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Prop;          // cane, accordion, flowers
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString QuestItem;     // row name in Items
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 QuestReward = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString ReceivesFrom;  // character who sends them something
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString ReceivesItem;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool HasOrders = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool HasQuiz = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool HasMusic = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 ChatCount = 0;
};

// Every fixed line, in order. Section: intro, remind, wrong, done, after, thanks, regive,
// receive, quiz_start, quiz_more, chat (Conversation = which chat), review_offer, review_none.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekDialogueLine : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Character;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Section;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 Conversation = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 Line = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Text;           // in the language being learned
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;
};

// Shop orders. "ask" lines are templates: {acc}, {gen}, {nom}, {why} take the item's forms in the
// language being learned (Items.Accusative, Genitive, Nominative, WhyText); {en}, {the}, {whyEn} its English.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekOrderLine : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Character;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Kind;          // ask or ok
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Text;           // in the language being learned
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString ItemPool;      // space-separated item row names
};

USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekItem : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Word;          // the label shown over it
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Lemma;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Nominative;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Accusative;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Genitive;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString English;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString EnglishThe;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) bool Plural = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString WhyText;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString WhyEnglish;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString StoryCharacter; // whose errand it belongs to
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float HomeX = 0;      // where it waits to be picked up
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float HomeY = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float HomeZ = 0;
};

// The word labels that float over things in the world.
USTRUCT(BlueprintType)
struct RYNEKSLOWEK_API FRynekLabel : public FTableRowBase
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Word;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Kind;          // sign, small, or empty
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float X = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Y = 0;
	UPROPERTY(EditAnywhere, BlueprintReadOnly) float Z = 0;
};
