# Ticket #3 QA — Phase 1/2 runner. Runs against BOTH worktrees:
#   F:\communal-qa-parent  (0c7f90c, has src/middleware.ts)
#   F:\communal-qa-patched (3b32874, has src/proxy.ts)
# Produces build logs, vitest results, and my own independent behavior-test
# results for both commits, written under qa/ticket-3-killtests/results/.

$ErrorActionPreference = "Continue"
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'

$root = "F:\communal"
$parentDir = "F:\communal-qa-parent"
$patchedDir = "F:\communal-qa-patched"
$resultsDir = "$root\qa\ticket-3-killtests\results"
New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null

$templatePath = "$root\qa\ticket-3-killtests\qa-killtest-behavior.test.ts"
$template = Get-Content $templatePath -Raw

function Write-KillTest($targetDir, $importLine, $fnName, $configExpr) {
    $content = $template
    $content = $content.Replace("__QA_IMPORT_LINE__", $importLine)
    $content = $content.Replace("__QA_FN__", $fnName)
    $content = $content.Replace("__QA_CONFIG__", $configExpr)
    $destDir = Join-Path $targetDir "src\__tests__"
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    $dest = Join-Path $destDir "qa-killtest-behavior.test.ts"
    Set-Content -Path $dest -Value $content -NoNewline
    Write-Output "Wrote $dest"
}

Write-Output "=== (c) FILE STATE CHECK ==="
Write-Output "--- parent ($parentDir) ---"
Write-Output "middleware.ts exists: $(Test-Path (Join-Path $parentDir 'src\middleware.ts'))"
Write-Output "proxy.ts exists: $(Test-Path (Join-Path $parentDir 'src\proxy.ts'))"
Write-Output "--- patched ($patchedDir) ---"
Write-Output "middleware.ts exists: $(Test-Path (Join-Path $patchedDir 'src\middleware.ts'))"
Write-Output "proxy.ts exists: $(Test-Path (Join-Path $patchedDir 'src\proxy.ts'))"

Write-KillTest $parentDir 'import { middleware, config } from "../middleware";' "middleware" "config"
Write-KillTest $patchedDir 'import { proxy, config } from "../proxy";' "proxy" "config"

Write-Output ""
Write-Output "=== (a) BUILD on PARENT (0c7f90c) ==="
Push-Location $parentDir
npm run build 2>&1 | Out-File -FilePath "$resultsDir\build-parent.log" -Encoding utf8
Write-Output "parent build exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== (a) BUILD on PATCHED (3b32874) ==="
Push-Location $patchedDir
npm run build 2>&1 | Out-File -FilePath "$resultsDir\build-patched.log" -Encoding utf8
Write-Output "patched build exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== (d) VITEST FULL SUITE on PARENT ==="
Push-Location $parentDir
npx vitest run 2>&1 | Out-File -FilePath "$resultsDir\vitest-parent.log" -Encoding utf8
Write-Output "parent vitest exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== (d) VITEST FULL SUITE on PATCHED ==="
Push-Location $patchedDir
npx vitest run 2>&1 | Out-File -FilePath "$resultsDir\vitest-patched.log" -Encoding utf8
Write-Output "patched vitest exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== (b) INDEPENDENT BEHAVIOR KILL-TEST on PARENT (against middleware()) ==="
Push-Location $parentDir
npx vitest run src/__tests__/qa-killtest-behavior.test.ts 2>&1 | Out-File -FilePath "$resultsDir\killtest-parent.log" -Encoding utf8
Write-Output "parent killtest exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== (b) INDEPENDENT BEHAVIOR KILL-TEST on PATCHED (against proxy()) ==="
Push-Location $patchedDir
npx vitest run src/__tests__/qa-killtest-behavior.test.ts 2>&1 | Out-File -FilePath "$resultsDir\killtest-patched.log" -Encoding utf8
Write-Output "patched killtest exit code: $LASTEXITCODE"
Pop-Location

Write-Output ""
Write-Output "=== GREP: deprecated/middleware-to-proxy warnings ==="
Write-Output "--- parent ---"
Select-String -Path "$resultsDir\build-parent.log" -Pattern "deprecated","middleware-to-proxy" -SimpleMatch
Write-Output "--- patched ---"
Select-String -Path "$resultsDir\build-patched.log" -Pattern "deprecated","middleware-to-proxy" -SimpleMatch

Write-Output ""
Write-Output "=== GREP: route manifest proxy/middleware registration marker ==="
Write-Output "--- parent ---"
Select-String -Path "$resultsDir\build-parent.log" -Pattern "Middleware","Proxy" -SimpleMatch
Write-Output "--- patched ---"
Select-String -Path "$resultsDir\build-patched.log" -Pattern "Middleware","Proxy" -SimpleMatch

Write-Output ""
Write-Output "=== DONE. Logs in $resultsDir ==="
