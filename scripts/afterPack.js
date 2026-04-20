const { execFileSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  if (context.electronPlatformName !== 'win32') return

  const rcedit = path.join(__dirname, '../node_modules/electron-winstaller/vendor/rcedit.exe')
  const exe = path.join(context.appOutDir, 'Marmotconn.exe')
  const icon = path.join(__dirname, '../assets/icon.ico')

  execFileSync(rcedit, [
    exe,
    '--set-icon', icon,
    '--set-version-string', 'FileDescription', 'Marmotconn',
    '--set-version-string', 'ProductName', 'Marmotconn',
    '--set-version-string', 'CompanyName', 'Holy Marmot',
    '--set-version-string', 'OriginalFilename', 'Marmotconn.exe',
    '--set-version-string', 'InternalName', 'Marmotconn',
    '--set-file-version', '1.0.0.0',
    '--set-product-version', '1.0.0.0',
  ])

  console.log('  • rcedit: icon ve version bilgisi güncellendi')
}
