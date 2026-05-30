const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const server = spawn('node', ['serve-dist.cjs']);
setTimeout(() => {
  try {
    let manifest = fs.readFileSync('twa-manifest.json', 'utf8');
    manifest = manifest.replace(/https:\/\/einundzwanzig-pool-tg.vercel.app\/manifest.json/g, 'http://localhost:12345/manifest.json');
    manifest = manifest.replace(/https:\/\/einundzwanzig-pool-tg.vercel.app\/bitcoin-logo-512.png/g, 'http://localhost:12345/bitcoin-logo-512.png');
    fs.writeFileSync('twa-manifest.json', manifest);

    const dir = path.join(process.env.HOME || '/', '.bubblewrap');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({
      jdkPath: '/usr/lib/jvm/java-17-openjdk-amd64',
      androidSdkPath: '/usr/local/lib/android/sdk'
    }));

    const output = execSync('npx @bubblewrap/cli update --skipVersionUpgrade', { encoding: 'utf8' });
    console.log("UPDATE SUCCESS:", output);
    const buildOutput = execSync('npx @bubblewrap/cli build', { encoding: 'utf8' });
    console.log("BUILD SUCCESS:", buildOutput);
  } catch (e) {
    console.error("ERROR:");
    console.error(e.stdout);
    console.error(e.stderr);
    console.error(e);
  } finally {
    server.kill();
  }
}, 3000);
