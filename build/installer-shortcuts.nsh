; CyberDesk installer options.
; This file is loaded by electron-builder through package.json -> build.nsis.include.
; It adds a normal setup page where the user can choose Desktop and Start Menu links.

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!ifndef BUILD_UNINSTALLER
  Var CyberDeskDesktopShortcutCheckbox
  Var CyberDeskStartMenuShortcutCheckbox
  Var CyberDeskCreateDesktopShortcut
  Var CyberDeskCreateStartMenuShortcut
!endif

; Default choices for normal interactive installs and silent installs.
!macro customInit
  StrCpy $CyberDeskCreateDesktopShortcut ${BST_CHECKED}
  StrCpy $CyberDeskCreateStartMenuShortcut ${BST_CHECKED}
!macroend

; Electron Builder inserts this macro after the install-directory page.
!macro customPageAfterChangeDir
  Page custom CyberDeskShortcutOptionsPage CyberDeskShortcutOptionsLeave
!macroend

!ifndef BUILD_UNINSTALLER
Function CyberDeskShortcutOptionsPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 22u "CyberDesk shortcuts"
  Pop $0

  ${NSD_CreateLabel} 0 18u 100% 18u "Choose where CyberDesk should appear after installation."
  Pop $0

  ${NSD_CreateCheckbox} 0 44u 100% 14u "Create a Desktop shortcut"
  Pop $CyberDeskDesktopShortcutCheckbox
  ${If} $CyberDeskCreateDesktopShortcut == ${BST_CHECKED}
    ${NSD_Check} $CyberDeskDesktopShortcutCheckbox
  ${EndIf}

  ${NSD_CreateCheckbox} 0 66u 100% 14u "Create a Start Menu shortcut"
  Pop $CyberDeskStartMenuShortcutCheckbox
  ${If} $CyberDeskCreateStartMenuShortcut == ${BST_CHECKED}
    ${NSD_Check} $CyberDeskStartMenuShortcutCheckbox
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function CyberDeskShortcutOptionsLeave
  ${NSD_GetState} $CyberDeskDesktopShortcutCheckbox $CyberDeskCreateDesktopShortcut
  ${NSD_GetState} $CyberDeskStartMenuShortcutCheckbox $CyberDeskCreateStartMenuShortcut
FunctionEnd
!endif

; The built-in installer creates shortcuts first; this macro removes the ones
; the user did not choose and keeps the finish-page launch target valid.
!macro customInstall
  ${If} $CyberDeskCreateDesktopShortcut != ${BST_CHECKED}
    Delete "$newDesktopLink"
  ${EndIf}

  ${If} $CyberDeskCreateStartMenuShortcut != ${BST_CHECKED}
    Delete "$newStartMenuLink"
    StrCpy $launchLink "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    !ifdef MENU_FILENAME
      RMDir "$SMPROGRAMS\${MENU_FILENAME}"
    !endif
  ${EndIf}
!macroend
