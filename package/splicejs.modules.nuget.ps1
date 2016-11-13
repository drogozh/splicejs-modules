$OutDir = '.'
$command = @'
nuget pack nuspec\splicejs.modules.nuspec -OutputDir $OutDir
'@

Invoke-Expression -Command:$command

