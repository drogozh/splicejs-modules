param(
[string]$outdir = '.'
)

$command = @'
nuget pack nuspec\splicejs.modules.nuspec -OutputDir $outDir
'@

Invoke-Expression -Command:$command

