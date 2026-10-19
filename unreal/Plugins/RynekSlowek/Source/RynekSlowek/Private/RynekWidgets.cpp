#include "RynekWidgets.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SWrapBox.h"
#include "Widgets/SBoxPanel.h"
#include "Styling/CoreStyle.h"
#include "Brushes/SlateRoundedBoxBrush.h"
#include "Styling/StyleDefaults.h"

namespace
{
	// the web game's panel colours (glazed stoneware: white glaze, cobalt rim)
	FLinearColor Glaze() { return FLinearColor(FColor::FromHex(TEXT("#F6F8FC"))); }
	FLinearColor Glaze2() { return FLinearColor(FColor::FromHex(TEXT("#E6ECF8"))); }
	FLinearColor Rim() { return FLinearColor(FColor::FromHex(TEXT("#1F3C91"))); }
	FLinearColor Ink() { return FLinearColor(FColor::FromHex(TEXT("#16224B"))); }
	FLinearColor Ink2() { return FLinearColor(FColor::FromHex(TEXT("#4C5A86"))); }
}

void URynekWordWidget::Show(const FString& InText, int32 InStatus)
{
	Text = InText;
	Status = InStatus;
	Apply();
}

TSharedRef<SWidget> URynekWordWidget::RebuildWidget()
{
	if (Brushes.Num() == 0)
	{
		for (int32 S = 0; S < 3; ++S) Brushes.Add(MakeShared<FSlateRoundedBoxBrush>(Glaze(), 12.f, URynekWords::StatusColor(S), 2.f));
		Brushes.Add(MakeShared<FSlateRoundedBoxBrush>(Rim(), 12.f, Glaze(), 2.f));
	}
	TSharedRef<SWidget> W = SAssignNew(Border, SBorder).Padding(FMargin(10.f, 4.f))
		[
			SAssignNew(TextBlock, STextBlock).Font(FCoreStyle::GetDefaultFontStyle("Bold", 14))
		];
	Apply();
	return W;
}

void URynekWordWidget::Apply()
{
	if (!TextBlock.IsValid() || !Border.IsValid() || Brushes.Num() < 4) return;
	const bool bName = Status < 0;
	TextBlock->SetText(FText::FromString(Text));
	TextBlock->SetColorAndOpacity(FSlateColor(bName ? Glaze() : URynekWords::StatusColor(Status)));
	Border->SetBorderImage(Brushes[bName ? 3 : FMath::Clamp(Status, 0, 2)].Get());
}

void URynekWordWidget::ReleaseSlateResources(bool bReleaseChildren)
{
	Super::ReleaseSlateResources(bReleaseChildren);
	TextBlock.Reset();
	Border.Reset();
}

TSharedRef<SWidget> URynekDialogueWidget::RebuildWidget()
{
	if (!PanelBrush.IsValid()) PanelBrush = MakeShared<FSlateRoundedBoxBrush>(Glaze(), 16.f, Rim(), 3.f);
	if (!SelectedBrush.IsValid()) SelectedBrush = MakeShared<FSlateRoundedBoxBrush>(Glaze2(), 6.f, Rim(), 2.f);
	return SNew(SBox).HAlign(HAlign_Center).VAlign(VAlign_Bottom).Padding(FMargin(20.f, 0.f, 20.f, 30.f))
		[
			SNew(SBox).WidthOverride(900.f)
			[
				SAssignNew(Panel, SBorder).BorderImage(PanelBrush.Get()).Padding(FMargin(20.f, 16.f)).Visibility(EVisibility::Collapsed)
				[
					SNew(SVerticalBox)
					+ SVerticalBox::Slot().AutoHeight()
					[
						SAssignNew(NameText, STextBlock).Font(FCoreStyle::GetDefaultFontStyle("Bold", 20)).ColorAndOpacity(FSlateColor(Rim()))
					]
					+ SVerticalBox::Slot().AutoHeight().Padding(FMargin(0.f, 8.f))
					[
						SAssignNew(WordBox, SWrapBox).UseAllottedSize(true)
					]
					+ SVerticalBox::Slot().AutoHeight()
					[
						SAssignNew(EnglishText, STextBlock).Font(FCoreStyle::GetDefaultFontStyle("Regular", 16)).ColorAndOpacity(FSlateColor(Ink2())).AutoWrapText(true)
					]
					+ SVerticalBox::Slot().AutoHeight().Padding(FMargin(0.f, 10.f, 0.f, 0.f))
					[
						SAssignNew(CardText, STextBlock).Font(FCoreStyle::GetDefaultFontStyle("Regular", 16)).ColorAndOpacity(FSlateColor(Ink())).AutoWrapText(true)
					]
					+ SVerticalBox::Slot().AutoHeight().Padding(FMargin(0.f, 8.f, 0.f, 0.f))
					[
						SAssignNew(HintText, STextBlock).Font(FCoreStyle::GetDefaultFontStyle("Regular", 13)).ColorAndOpacity(FSlateColor(Ink2()))
						.Text(FText::FromString(TEXT("E next line  \u00B7  Tab next word  \u00B7  1 new \u00B7 2 learning \u00B7 3 known  \u00B7  Q leave")))
					]
				]
			]
		];
}

void URynekDialogueWidget::ShowLine(const FString& Speaker, const TArray<FRynekToken>& Tokens, const FString& English, int32 Selected, URynekWords* Words)
{
	if (!Panel.IsValid() || !Words) return;
	bShown = true;
	Panel->SetVisibility(EVisibility::Visible);
	NameText->SetText(FText::FromString(Speaker));
	EnglishText->SetText(FText::FromString(English));
	WordBox->ClearChildren();
	FString Card;
	int32 WordIndex = 0;
	for (const FRynekToken& T : Tokens)
	{
		const bool bSelected = T.bWord && WordIndex == Selected;
		const FLinearColor Color = T.bWord ? URynekWords::StatusColor(Words->GetStatus(T.Key)) : Ink();
		WordBox->AddSlot().Padding(FMargin(0.f, 2.f))
			[
				SNew(SBorder).BorderImage(bSelected ? SelectedBrush.Get() : FStyleDefaults::GetNoBrush()).Padding(FMargin(bSelected ? 3.f : 0.f, 0.f))
				[
					SNew(STextBlock).Text(FText::FromString(T.Text)).ColorAndOpacity(FSlateColor(Color))
					.Font(FCoreStyle::GetDefaultFontStyle(T.bWord ? "Bold" : "Regular", 24))
				]
			];
		if (bSelected)
		{
			FRynekWordForm W;
			if (Words->Lookup(T.Key, W))
			{
				Card = W.Form.IsEmpty() ? FString::Printf(TEXT("%s: %s"), *T.Text, *W.English)
					: FString::Printf(TEXT("%s \u2192 %s: %s (%s)"), *T.Text, *W.Lemma, *W.English, *W.Form);
				if (!W.Note.IsEmpty()) Card += TEXT("\n") + W.Note;
			}
			else Card = T.Text;
		}
		if (T.bWord) ++WordIndex;
	}
	CardText->SetText(FText::FromString(Card));
}

void URynekDialogueWidget::Hide()
{
	bShown = false;
	if (Panel.IsValid()) Panel->SetVisibility(EVisibility::Collapsed);
}

void URynekDialogueWidget::ReleaseSlateResources(bool bReleaseChildren)
{
	Super::ReleaseSlateResources(bReleaseChildren);
	bShown = false;
	Panel.Reset(); NameText.Reset(); EnglishText.Reset(); CardText.Reset(); HintText.Reset(); WordBox.Reset();
}
