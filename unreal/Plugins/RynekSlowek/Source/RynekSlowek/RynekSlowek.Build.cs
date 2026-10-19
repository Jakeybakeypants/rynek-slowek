using UnrealBuildTool;

public class RynekSlowek : ModuleRules
{
	public RynekSlowek(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "UMG", "Slate", "SlateCore" });
		PrivateDependencyModuleNames.AddRange(new string[] { "Projects", "Json", "JsonUtilities" });
	}
}
