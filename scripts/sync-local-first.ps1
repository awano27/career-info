param(
  [string]$Message = "chore(sync): local-first sync",
  [switch]$NoRebase
)

$ProgressPreference = 'SilentlyContinue'
function Exec($cmd, $allowFail=$false) {
  Write-Host "â $cmd"
  $output = & powershell -NoProfile -Command $cmd 2>&1
  $code = $LASTEXITCODE
  if (-not $allowFail -and $code -ne 0) {
    Write-Error "Command failed ($code): $cmd`n$output"
    exit $code
  }
  return @{ code=$code; output=$output }
}

# Ensure we are in a git repo
$inRepo = (git rev-parse --is-inside-work-tree 2>$null)
if (-not $inRepo) { Write-Error "Not a git repository"; exit 1 }

# Current branch
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ([string]::IsNullOrWhiteSpace($branch) -or $branch -eq 'HEAD') {
  Write-Error "Detached HEAD not supported by this helper"; exit 1
}

# Ensure upstream exists; if not, attempt to set to origin/<branch>
$upstream = (git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>$null)
if (-not $?) {
  $defaultUp = "origin/$branch"
  Write-Host "Upstream not set. Trying to track $defaultUp"
  Exec "git branch --set-upstream-to=$defaultUp $branch" $false | Out-Null
}

# Stage everything and commit if there are changes
Exec "git add -A" | Out-Null
$hasChanges = (git diff --cached --quiet) -notcontains $true
if ($LASTEXITCODE -ne 0) { $hasChanges = $true }
if ($hasChanges) {
  Exec "git commit -m \"$Message\"" | Out-Null
} else {
  Write-Host "No staged changes to commit"
}

# Fetch latest
Exec "git fetch --all --prune" | Out-Null

# Try push fast
$push = Exec "git push" $true
if ($push.code -eq 0) {
  Write-Host "Push succeeded"
  exit 0
}

Write-Host "Initial push failed. Will try ${(if($NoRebase){'merge'}else{'rebase'})} flow."

if ($NoRebase) {
  Exec "git pull --no-edit" | Out-Null
} else {
  $pull = Exec "git pull --rebase" $true
  if ($pull.code -ne 0) {
    Write-Warning "Rebase encountered issues. Resolve conflicts, then run: git rebase --continue; git push"
    exit $pull.code
  }
}

# Push again
Exec "git push" | Out-Null
Write-Host "Push completed after sync"