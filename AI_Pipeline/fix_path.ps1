$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not $userPath) { $userPath = "" }
if (-not $userPath.Contains('Python310')) {
    $newPath = $userPath + ';C:\Users\abdou\AppData\Local\Programs\Python\Python310\;C:\Users\abdou\AppData\Local\Programs\Python\Python310\Scripts\'
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    Write-Output "Path updated successfully."
} else {
    Write-Output "Python 3.10 is already in the PATH."
}
