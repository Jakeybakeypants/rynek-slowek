// The on-screen parts, built in C++ with Slate so the plugin needs no widget assets:
// URynekWordWidget is a floating label (a word in its status colour, or a person's name tag),
// URynekDialogueWidget is the conversation box at the bottom of the screen.
#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "RynekWords.h"
#include "RynekWidgets.generated.h"

class STextBlock;
class SBorder;
class SWrapBox;

UCLASS()
class RYNEKSLOWEK_API URynekWordWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	// Status 0, 1, 2 colour the word; -1 makes it a name tag.
	void Show(const FString& Text, int32 Status);
protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void ReleaseSlateResources(bool bReleaseChildren) override;
private:
	FString Text;
	int32 Status = 0;
	TSharedPtr<STextBlock> TextBlock;
	TSharedPtr<SBorder> Border;
	TArray<TSharedPtr<FSlateBrush>> Brushes;   // new, learning, known, name
	void Apply();
};

UCLASS()
class RYNEKSLOWEK_API URynekDialogueWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	void ShowLine(const FString& Speaker, const TArray<FRynekToken>& Tokens, const FString& English, int32 Selected, URynekWords* Words);
	void Hide();
	bool IsShown() const { return bShown; }
protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void ReleaseSlateResources(bool bReleaseChildren) override;
private:
	bool bShown = false;
	TSharedPtr<SBorder> Panel;
	TSharedPtr<STextBlock> NameText, EnglishText, CardText, HintText;
	TSharedPtr<SWrapBox> WordBox;
	TSharedPtr<FSlateBrush> PanelBrush, SelectedBrush;
};
