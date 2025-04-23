"use strict";
//check-updates.js - v.hn.202410271811
const { execSync } = require('child_process');
try {
    console.log('Checking for package updates...');
    const updates = execSync('npm outdated --json', { encoding: 'utf8' });
    try {
        const outdated = JSON.parse(updates);
        const needsUpdate = Object.keys(outdated).length > 0;
        if (needsUpdate) {
            console.log('Updates available for:');
            Object.entries(outdated).forEach(([pkg, info]) => {
                console.log(`${pkg}: ${info.current} -> ${info.latest}`);
            });
            // 更新が見つかってもエラーとしない
            process.exit(0);
        }
        else {
            console.log('All packages are up to date!');
            process.exit(0);
        }
    }
    catch (error) {
        // JSONパースエラーの場合は、更新が不要と判断
        console.log('No updates found or all packages are up to date.');
        process.exit(0);
    }
}
catch (error) {
    // npm outdated の出力がある場合（更新が必要なパッケージがある場合）
    if (error.stdout) {
        console.log('Updates available:');
        console.log(error.stdout);
        // 更新が見つかってもエラーとしない
        process.exit(0);
    }
    else {
        // その他のエラー
        console.error('Error checking for updates:', error.message);
        process.exit(0);
    }
}
//# sourceMappingURL=check-updates.js.map