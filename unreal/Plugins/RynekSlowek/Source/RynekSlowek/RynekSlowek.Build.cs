using UnrealBuildTool;

public class RynekSlowek : ModuleRules
{
	public RynekSlowek(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "UMG", "Slate", "SlateCore" });
		PrivateDependencyModuleNames.AddRange(new string[] { "Projects", "Json", "JsonUtilities" });
		// URynekWords reads these at run time, so a packaged game has to carry them
		foreach (string Lang in new string[] { "pl", "de", "es", "fr" })
			RuntimeDependencies.Add("$(PluginDir)/Data/" + Lang + "/rynek-data.json");
	}
}
