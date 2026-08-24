Option Explicit

Function Utf8UrlEncode(value)
  Dim stream, bytes, index, current, encoded
  Set stream = CreateObject("ADODB.Stream")
  stream.Type = 2
  stream.Charset = "utf-8"
  stream.Open
  stream.WriteText value
  stream.Position = 0
  stream.Type = 1
  stream.Position = 3
  bytes = stream.Read
  stream.Close

  encoded = ""
  For index = 1 To LenB(bytes)
    current = AscB(MidB(bytes, index, 1))
    If (current >= 48 And current <= 57) Or _
       (current >= 65 And current <= 90) Or _
       (current >= 97 And current <= 122) Or _
       current = 45 Or current = 46 Or current = 47 Or _
       current = 58 Or current = 95 Or current = 126 Then
      encoded = encoded & Chr(current)
    Else
      encoded = encoded & "%" & Right("0" & Hex(current), 2)
    End If
  Next
  Utf8UrlEncode = encoded
End Function

Dim fso, shell, shellApp, projectRoot, htmlPath, appUrl, edgePaths, edgePath, candidate
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
Set shellApp = CreateObject("Shell.Application")

projectRoot = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = projectRoot & "\desktop\index.html"

If Not fso.FileExists(htmlPath) Then
  MsgBox "Desktop entry was not found: " & htmlPath, vbCritical, "Guanxiang"
  WScript.Quit 1
End If

appUrl = "file:///" & Utf8UrlEncode(Replace(htmlPath, "\", "/"))
edgePaths = Array( _
  shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe", _
  shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe", _
  shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Microsoft\Edge\Application\msedge.exe" _
)

edgePath = ""
For Each candidate In edgePaths
  If fso.FileExists(candidate) Then
    edgePath = candidate
    Exit For
  End If
Next

If edgePath <> "" Then
  shell.Run Chr(34) & edgePath & Chr(34) & " --app=" & Chr(34) & appUrl & Chr(34) & " --start-maximized", 1, False
Else
  shellApp.ShellExecute htmlPath, "", projectRoot, "open", 1
End If
