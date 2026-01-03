# Lance Claude Code en mode auto (sans demande de permission)
# Usage: .\claude-auto.ps1 "votre prompt ici"
# Ou simplement: .\claude-auto.ps1 pour le mode interactif

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Prompt
)

$claudePath = "$env:APPDATA\npm\claude.cmd"

if ($Prompt) {
    & $claudePath -p ($Prompt -join " ") --dangerously-skip-permissions
} else {
    & $claudePath --dangerously-skip-permissions
}
