Option Explicit

Dim fileSystem, shell, projectRoot, devProjectRoot, devtoolsPath, cliPath, quote, command, mapResult, openResult, pageResult
Dim devtoolsFolder, devtoolsExe
Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

projectRoot = fileSystem.GetParentFolderName(WScript.ScriptFullName)
devProjectRoot = "G:\."
devtoolsFolder = ChrW(&H5FAE) & ChrW(&H4FE1) & "web" & ChrW(&H5F00) & ChrW(&H53D1) & ChrW(&H8005) & ChrW(&H5DE5) & ChrW(&H5177)
devtoolsExe = ChrW(&H5FAE) & ChrW(&H4FE1) & ChrW(&H5F00) & ChrW(&H53D1) & ChrW(&H8005) & ChrW(&H5DE5) & ChrW(&H5177) & ".exe"
devtoolsPath = fileSystem.BuildPath(projectRoot, devtoolsFolder & "\" & devtoolsExe)
cliPath = fileSystem.BuildPath(projectRoot, devtoolsFolder & "\wechatide.cmd")
quote = Chr(34)

If Not fileSystem.FileExists(devtoolsPath) Then
  MsgBox "WeChat DevTools was not found: " & devtoolsPath, vbCritical, "Guanxiang"
  WScript.Quit 1
End If

If Not fileSystem.FileExists(cliPath) Then
  MsgBox "WeChat DevTools command was not found: " & cliPath, vbCritical, "Guanxiang"
  WScript.Quit 1
End If

If Not fileSystem.FileExists(fileSystem.BuildPath(devProjectRoot, "project.config.json")) Then
  mapResult = shell.Run("cmd.exe /d /c subst G: " & quote & projectRoot & quote, 0, True)
  If mapResult <> 0 Then
    MsgBox "Cannot create G:\. Please make sure drive G: is free.", vbCritical, "Guanxiang"
    WScript.Quit mapResult
  End If
End If

If Not fileSystem.FileExists(fileSystem.BuildPath(devProjectRoot, "miniprogram\app.json")) Then
  MsgBox "G:\ does not point to this project. Release drive G: and retry.", vbCritical, "Guanxiang"
  WScript.Quit 1
End If

shell.Run quote & devtoolsPath & quote, 1, False
WScript.Sleep 6000

command = quote & cliPath & quote & " -c guanxiang open_project_window --project " & quote & devProjectRoot & quote & " --window-mode fullMode"
openResult = shell.Run(command, 0, True)
If openResult <> 0 Then
  MsgBox "WeChat DevTools could not open the project. Exit code: " & openResult, vbCritical, "Guanxiang"
  WScript.Quit openResult
End If

WScript.Sleep 8000
command = quote & cliPath & quote & " -c guanxiang simulator_open_page --project " & quote & devProjectRoot & quote & " --page pages/launch/launch"
pageResult = shell.Run(command, 0, True)
If pageResult <> 0 Then
  MsgBox "The fixed start page could not be displayed. Exit code: " & pageResult, vbCritical, "Guanxiang"
  WScript.Quit pageResult
End If
