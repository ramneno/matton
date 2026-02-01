// ゲーム状態管理
const state = {
    currentScreen: 'op',
    selectedMode: null, // 選択されたゲームモード ('target', 'moving', 'bouncing')
    selectedWeapon: null,
    gameStartTime: null,
    gameDuration: 60000, // 60秒
    shots: [],
    targetPosition: { x: 0, y: 0 },
    targetStartPosition: { x: 0, y: 0 },
    targetEndPosition: { x: 0, y: 0 },
    targetMoveStartTime: null,
    targetMoveDuration: 500, // 移動時間（ミリ秒）
    targetMovedAt: null,
    currentSpread: 0,
    lastShotTime: null,
    canvas: null,
    ctx: null,
    targetRadius: 50,
    crosshairPosition: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 },
    bulletHoles: [], // 銃弾の跡
    isMouseDown: false,
    autoFireInterval: null,
    currentRecoilY: 0, // 現在の反動（Y軸方向）
    currentRecoilX: 0, // 現在の反動（X軸方向）
    baseCrosshairY: 0, // マウス位置ベースのクロスヘアY座標
    baseCrosshairX: 0, // マウス位置ベースのクロスヘアX座標
    isScoped: false, // スコープモード（スナイパーライフル用）
    viewOffsetX: 0, // スコープモード時の視点オフセット（X軸）
    viewOffsetY: 0, // スコープモード時の視点オフセット（Y軸）
    scopeCenterX: 0, // スコープの中心位置（X軸）- 右クリック時のクロスヘア位置
    scopeCenterY: 0, // スコープの中心位置（Y軸）- 右クリック時のクロスヘア位置
    gameLoopRunning: false, // ゲームループが実行中かどうか
    gameEnded: false, // ゲームが終了したかどうか
    bgmAudio: null, // BGM用のAudio要素
    crosshairColor: 'white', // クロスヘアの色（white, yellowgreen, magenta）
    // 移動標的モード用
    movingTargets: [],
    wallBulletHoles: [], // 木の壁専用の銃痕
    wallImage: null, // 木の壁画像
    targetModeBgImage: null, // 移動標的モード背景画像
    // バウンドモード用
    balls: [],
    boundModeBgImage: null // バウンドモード背景画像
};

// 武器データ定義（実銃特性を反映）
const weapons = [
    // Assault Rifles
    // M4A1: 5.56mm、バッファーシステムで反動低減、制御しやすい（標準音量、標準速度、バランス型EQ）
    { name: 'M4A1', category: 'Assault Rifles', rpm: 700, modes: ['auto', 'semi'], spreadBasePx: 2, spreadGrowPx: 1.5, spreadRecoverPerMs: 0.05, recoilKickPx: 3, baseScore: 100, recoilVertical: 25, recoilHorizontal: 8, recoilRecoveryPerMs: 0.08, soundVolume: 0.55, soundPlaybackRate: 1.0, soundLowGain: 0, soundHighGain: 0 },
    // HK416: M4A1の改良型、反動さらに低減（標準音量、標準速度、クリーン、やや高音強調）
    { name: 'HK416', category: 'Assault Rifles', rpm: 700, modes: ['auto', 'semi'], spreadBasePx: 1.5, spreadGrowPx: 1.2, spreadRecoverPerMs: 0.06, recoilKickPx: 2.5, baseScore: 100, recoilVertical: 22, recoilHorizontal: 7, recoilRecoveryPerMs: 0.09, soundVolume: 0.52, soundPlaybackRate: 1.0, soundLowGain: -2, soundHighGain: 3 },
    // AK-47: 7.62mm、ガス圧高め、反動大（高音量、やや低速度、重厚、低音強調）
    { name: 'AK-47', category: 'Assault Rifles', rpm: 600, modes: ['auto', 'semi'], spreadBasePx: 3, spreadGrowPx: 2, spreadRecoverPerMs: 0.04, recoilKickPx: 5, baseScore: 100, recoilVertical: 45, recoilHorizontal: 15, recoilRecoveryPerMs: 0.05, soundVolume: 0.65, soundPlaybackRate: 0.92, soundLowGain: 8, soundHighGain: -3 },
    // FN SCAR-L: 5.56mm、バランス型（標準音量、標準速度、バランス型EQ）
    { name: 'FN SCAR-L', category: 'Assault Rifles', rpm: 625, modes: ['auto', 'semi'], spreadBasePx: 2, spreadGrowPx: 1.3, spreadRecoverPerMs: 0.05, recoilKickPx: 3, baseScore: 100, recoilVertical: 28, recoilHorizontal: 9, recoilRecoveryPerMs: 0.07, soundVolume: 0.55, soundPlaybackRate: 1.0, soundLowGain: 1, soundHighGain: 1 },
    // Steyr AUG: ブルパップ設計、反動中程度（標準音量、やや高速度、やや高音強調）
    { name: 'Steyr AUG', category: 'Assault Rifles', rpm: 680, modes: ['auto', 'semi'], spreadBasePx: 2.5, spreadGrowPx: 1.4, spreadRecoverPerMs: 0.05, recoilKickPx: 3.5, baseScore: 100, recoilVertical: 30, recoilHorizontal: 10, recoilRecoveryPerMs: 0.07, soundVolume: 0.58, soundPlaybackRate: 1.05, soundLowGain: -1, soundHighGain: 4 },
    // Galil: AKベース、反動大め（高音量、やや低速度、重厚、低音強調）
    { name: 'Galil', category: 'Assault Rifles', rpm: 650, modes: ['auto', 'semi'], spreadBasePx: 2.5, spreadGrowPx: 1.6, spreadRecoverPerMs: 0.05, recoilKickPx: 4, baseScore: 100, recoilVertical: 38, recoilHorizontal: 13, recoilRecoveryPerMs: 0.06, soundVolume: 0.62, soundPlaybackRate: 0.95, soundLowGain: 6, soundHighGain: -2 },
    // FAMAS: 高ROF、ブルパップ、反動中程度だが連射で累積（高音量、高速度、高音強調）
    { name: 'FAMAS', category: 'Assault Rifles', rpm: 1000, modes: ['burst3', 'auto', 'semi'], spreadBasePx: 3, spreadGrowPx: 2.5, spreadRecoverPerMs: 0.03, recoilKickPx: 4.5, baseScore: 100, recoilVertical: 35, recoilHorizontal: 12, recoilRecoveryPerMs: 0.06, soundVolume: 0.60, soundPlaybackRate: 1.15, soundLowGain: -2, soundHighGain: 5 },
    // AK-74: 5.45mm、AK-47より反動少なめ（中音量、標準速度、やや低音強調）
    { name: 'AK-74', category: 'Assault Rifles', rpm: 650, modes: ['auto', 'semi'], spreadBasePx: 2, spreadGrowPx: 1.5, spreadRecoverPerMs: 0.05, recoilKickPx: 3.5, baseScore: 100, recoilVertical: 32, recoilHorizontal: 11, recoilRecoveryPerMs: 0.07, soundVolume: 0.58, soundPlaybackRate: 1.0, soundLowGain: 4, soundHighGain: 0 },
    // K2: 韓国製、バランス型（標準音量、やや高速度、やや高音強調）
    { name: 'K2', category: 'Assault Rifles', rpm: 800, modes: ['burst3', 'auto', 'semi'], spreadBasePx: 2.5, spreadGrowPx: 1.8, spreadRecoverPerMs: 0.04, recoilKickPx: 3.5, baseScore: 100, recoilVertical: 30, recoilHorizontal: 10, recoilRecoveryPerMs: 0.07, soundVolume: 0.56, soundPlaybackRate: 1.08, soundLowGain: 0, soundHighGain: 3 },
    // 20式: 最新型、反動低減設計（標準音量、標準速度、クリーン、やや高音強調）
    { name: '20式5.56mm小銃', category: 'Assault Rifles', rpm: 750, modes: ['auto', 'semi'], spreadBasePx: 1.8, spreadGrowPx: 1.3, spreadRecoverPerMs: 0.06, recoilKickPx: 2.8, baseScore: 100, recoilVertical: 23, recoilHorizontal: 8, recoilRecoveryPerMs: 0.08, soundVolume: 0.53, soundPlaybackRate: 1.0, soundLowGain: -1, soundHighGain: 2 },
    
    // Submachine Guns
    // MP5: 9mm、反動少なめ、制御しやすい（標準音量、高速度、軽快、高音強調）
    { name: 'MP5', category: 'Submachine Guns', rpm: 1000, modes: ['auto', 'semi'], spreadBasePx: 2.5, spreadGrowPx: 1.5, spreadRecoverPerMs: 0.05, recoilKickPx: 2, baseScore: 80, recoilVertical: 18, recoilHorizontal: 6, recoilRecoveryPerMs: 0.1, soundVolume: 0.50, soundPlaybackRate: 1.20, soundLowGain: -3, soundHighGain: 6 },
    // UMP45: .45ACP、反動中程度（高音量、やや低速度、重厚、低音強調）
    { name: 'UMP45', category: 'Submachine Guns', rpm: 800, modes: ['auto', 'semi'], spreadBasePx: 3, spreadGrowPx: 1.8, spreadRecoverPerMs: 0.04, recoilKickPx: 3.5, baseScore: 80, recoilVertical: 25, recoilHorizontal: 9, recoilRecoveryPerMs: 0.08, soundVolume: 0.58, soundPlaybackRate: 0.95, soundLowGain: 7, soundHighGain: -2 },
    // Vector: 特殊な反動低減システム、反動極小（低音量、高速度、静かめ、高音強調）
    { name: 'Vector', category: 'Submachine Guns', rpm: 1400, modes: ['auto', 'semi'], spreadBasePx: 2, spreadGrowPx: 2, spreadRecoverPerMs: 0.04, recoilKickPx: 1.5, baseScore: 80, recoilVertical: 10, recoilHorizontal: 4, recoilRecoveryPerMs: 0.12, soundVolume: 0.45, soundPlaybackRate: 1.30, soundLowGain: -4, soundHighGain: 7 },
    // P90: ブルパップ、反動少なめ（標準音量、高速度、高音強調）
    { name: 'P90', category: 'Submachine Guns', rpm: 1100, modes: ['auto', 'semi'], spreadBasePx: 2.5, spreadGrowPx: 1.6, spreadRecoverPerMs: 0.05, recoilKickPx: 2.2, baseScore: 80, recoilVertical: 20, recoilHorizontal: 7, recoilRecoveryPerMs: 0.09, soundVolume: 0.52, soundPlaybackRate: 1.15, soundLowGain: -2, soundHighGain: 5 },
    // MP7: 4.6mm、反動少なめ（標準音量、高速度、軽快、高音強調）
    { name: 'MP7', category: 'Submachine Guns', rpm: 1150, modes: ['auto', 'semi'], spreadBasePx: 2.2, spreadGrowPx: 1.7, spreadRecoverPerMs: 0.05, recoilKickPx: 2, baseScore: 80, recoilVertical: 18, recoilHorizontal: 6, recoilRecoveryPerMs: 0.1, soundVolume: 0.48, soundPlaybackRate: 1.25, soundLowGain: -3, soundHighGain: 6 },
    // MAC-10: 極端に高ROF、反動軽減（高音量、非常に高速度、高音強調）
    { name: 'MAC-10', category: 'Submachine Guns', rpm: 1550, modes: ['auto', 'semi'], spreadBasePx: 3.5, spreadGrowPx: 2.5, spreadRecoverPerMs: 0.03, recoilKickPx: 4, baseScore: 80, recoilVertical: 24, recoilHorizontal: 8, recoilRecoveryPerMs: 0.06, soundVolume: 0.62, soundPlaybackRate: 1.40, soundLowGain: -1, soundHighGain: 8 },
    // UZI: 反動中程度（標準音量、標準速度、バランス型EQ）
    { name: 'UZI', category: 'Submachine Guns', rpm: 800, modes: ['auto', 'semi'], spreadBasePx: 3.5, spreadGrowPx: 2, spreadRecoverPerMs: 0.04, recoilKickPx: 4, baseScore: 80, recoilVertical: 28, recoilHorizontal: 10, recoilRecoveryPerMs: 0.07, soundVolume: 0.54, soundPlaybackRate: 1.0, soundLowGain: 2, soundHighGain: 2 },
    
    // Handguns
    // Glock 17: 9mm、反動中程度（標準音量、標準速度、バランス型EQ）
    { name: 'Glock 17', category: 'Handguns', rpm: 300, modes: ['semi'], spreadBasePx: 3, spreadGrowPx: 0.5, spreadRecoverPerMs: 0.1, recoilKickPx: 4, baseScore: 150, recoilVertical: 35, recoilHorizontal: 13, recoilRecoveryPerMs: 0.15, soundVolume: 0.50, soundPlaybackRate: 1.0, soundLowGain: 0, soundHighGain: 0 },
    // M1911: .45ACP、反動大（高音量、低速度、重厚、低音強調）
    { name: 'M1911', category: 'Handguns', rpm: 250, modes: ['semi'], spreadBasePx: 3.5, spreadGrowPx: 0.6, spreadRecoverPerMs: 0.12, recoilKickPx: 5, baseScore: 150, recoilVertical: 50, recoilHorizontal: 18, recoilRecoveryPerMs: 0.12, soundVolume: 0.60, soundPlaybackRate: 0.88, soundLowGain: 6, soundHighGain: -2 },
    // SIG P226: 9mm、反動中程度（標準音量、標準速度、やや高音強調）
    { name: 'SIG P226', category: 'Handguns', rpm: 280, modes: ['semi'], spreadBasePx: 2.8, spreadGrowPx: 0.5, spreadRecoverPerMs: 0.1, recoilKickPx: 4, baseScore: 150, recoilVertical: 32, recoilHorizontal: 11, recoilRecoveryPerMs: 0.14, soundVolume: 0.52, soundPlaybackRate: 1.0, soundLowGain: -1, soundHighGain: 2 },
    // Beretta 92: 9mm、反動中程度（標準音量、標準速度、バランス型EQ）
    { name: 'Beretta 92', category: 'Handguns', rpm: 300, modes: ['semi'], spreadBasePx: 3, spreadGrowPx: 0.5, spreadRecoverPerMs: 0.1, recoilKickPx: 4, baseScore: 150, recoilVertical: 35, recoilHorizontal: 13, recoilRecoveryPerMs: 0.15, soundVolume: 0.51, soundPlaybackRate: 1.0, soundLowGain: 0, soundHighGain: 1 },
    // FN Five-seveN: 5.7mm、反動少なめ（標準音量、やや高速度、軽快、高音強調）
    { name: 'FN Five-seveN', category: 'Handguns', rpm: 320, modes: ['semi'], spreadBasePx: 2.5, spreadGrowPx: 0.4, spreadRecoverPerMs: 0.1, recoilKickPx: 3.5, baseScore: 150, recoilVertical: 28, recoilHorizontal: 10, recoilRecoveryPerMs: 0.16, soundVolume: 0.48, soundPlaybackRate: 1.10, soundLowGain: -2, soundHighGain: 4 },
    // Desert Eagle: .50AE、反動極大（非常に高音量、低速度、極めて重厚、極めて低音強調）
    // .50AEは極めて強力な弾薬で、反動は非常に大きい
    { name: 'Desert Eagle', category: 'Handguns', rpm: 200, modes: ['semi'], spreadBasePx: 5, spreadGrowPx: 1, spreadRecoverPerMs: 0.15, recoilKickPx: 8, baseScore: 200, recoilVertical: 70, recoilHorizontal: 25, recoilRecoveryPerMs: 0.08, soundVolume: 0.75, soundPlaybackRate: 0.80, soundLowGain: 12, soundHighGain: -5 }
];

// 武器データにfireIntervalMsを追加
weapons.forEach(weapon => {
    weapon.fireIntervalMs = Math.round(60000 / weapon.rpm);
});

// カテゴリ名の日本語マッピング
const categoryNames = {
    'Assault Rifles': 'アサルトライフル',
    'Submachine Guns': 'サブマシンガン',
    'Handguns': 'ハンドガン'
};

// 武器名から画像パスを取得する関数
function getWeaponImagePath(weaponName) {
    const imageMap = {
        // Assault Rifles
        'M4A1': 'img/ar/m4a1.png',
        'HK416': 'img/ar/hk416.png',
        'AK-47': 'img/ar/ak47.png',
        'FN SCAR-L': 'img/ar/fnscarl.png',
        'Steyr AUG': 'img/ar/steyraug.png',
        'Galil': 'img/ar/galil.png',
        'FAMAS': 'img/ar/famas.png',
        'AK-74': 'img/ar/ak74.png',
        'K2': 'img/ar/k2.png',
        '20式5.56mm小銃': 'img/ar/type20.png',
        // Submachine Guns
        'MP5': 'img/smg/mp5.png',
        'UMP45': 'img/smg/ump45.png',
        'Vector': 'img/smg/vecter.png',
        'P90': 'img/smg/p90.png',
        'MP7': 'img/smg/mp7.png',
        'MAC-10': 'img/smg/mac10.png',
        'UZI': 'img/smg/uzi.png',
        // Handguns
        'Glock 17': 'img/hg/glock17.png',
        'M1911': 'img/hg/m1911.png',
        'SIG P226': 'img/hg/sigp226.png',
        'Beretta 92': 'img/hg/beretta92.png',
        'FN Five-seveN': 'img/hg/fn5-7.png',
        'Desert Eagle': 'img/hg/deserteagle50ae.png'
    };
    return imageMap[weaponName] || null;
}

// 武器の説明データ
const weaponDescriptions = {
    // Assault Rifles
    'M4A1': 'M4A1はアメリカ軍の標準小銃で、5.56mm弾を使用。M16の短縮型として開発され、バッファーシステムにより反動が低減され、高い精度と制御性を実現。世界中の軍隊や特殊部隊で広く使用されている。',
    'HK416': 'HK416はドイツのH&K社が開発したM4A1の改良型。ガスピストン方式を採用し、M4A1よりも高い信頼性と反動制御を実現。多くの特殊部隊で採用されている高品質なアサルトライフル。',
    'AK-47': 'AK-47は旧ソ連で開発された7.62mmアサルトライフル。シンプルな構造と高い信頼性で知られ、世界中で最も広く使用されている銃の一つ。反動は大きいが、その威力と耐久性は伝説的。',
    'FN SCAR-L': 'FN SCAR-LはベルギーのFN社が開発した5.56mmアサルトライフル。モジュラー設計により、様々な用途に対応可能。バランスの取れた性能で、特殊部隊でも使用されている。',
    'Steyr AUG': 'Steyr AUGはオーストリアで開発されたブルパップ式アサルトライフル。銃身を長く保ちながら全長を短縮できる設計で、取り回しが良い。独特の外観と高い性能で知られる。',
    'Galil': 'Galilはイスラエルで開発されたアサルトライフル。AK-47をベースに改良され、高い精度と信頼性を実現。イスラエル国防軍の標準装備として長年使用されている。',
    'FAMAS': 'FAMASはフランス軍の標準小銃。ブルパップ設計で、高い連射速度が特徴。3点バーストモードを備え、制御しやすい連射が可能。独特のデザインで知られる。',
    'AK-74': 'AK-74はAK-47の後継として開発された5.45mmアサルトライフル。より小さな弾薬により反動が軽減され、精度が向上。ロシア軍の標準装備として使用されている。',
    'K2': 'K2は韓国で開発されたアサルトライフル。M16とAK-47の良い部分を組み合わせた設計で、バランスの取れた性能を実現。韓国軍の標準装備として使用されている。',
    '20式5.56mm小銃': '20式5.56mm小銃は日本の最新型小銃。89式小銃の後継として開発され、反動低減技術とモジュラー設計を採用。高い精度と信頼性を実現している。',
    // Submachine Guns
    'MP5': 'MP5はドイツのH&K社が開発した9mmサブマシンガン。高い精度と信頼性で知られ、世界中の特殊部隊や警察で使用されている。反動が少なく、制御しやすい。',
    'UMP45': 'UMP45はMP5の後継として開発された.45ACPサブマシンガン。より大きな弾薬により高い停止力を実現。MP5よりも反動は大きいが、その威力は高い。',
    'Vector': 'Vectorは特殊な反動低減システムを採用したサブマシンガン。内部機構により反動を極限まで低減し、連射時の精度が非常に高い。独特のメカニズムで知られる。',
    'P90': 'P90はベルギーのFN社が開発したブルパップ式サブマシンガン。5.7mm弾を使用し、高い貫通力を持つ。独特のデザインと高い性能で、特殊部隊でも使用されている。',
    'MP7': 'MP7はドイツのH&K社が開発した4.6mmサブマシンガン。PDW（個人防衛武器）として設計され、高い連射速度と軽量さを実現。特殊部隊で広く使用されている。',
    'MAC-10': 'MAC-10は極端に高い連射速度を持つサブマシンガン。その連射速度は1350RPMに達し、近距離での火力は圧倒的。反動は大きいが、その火力は伝説的。',
    'UZI': 'UZIはイスラエルで開発されたサブマシンガン。シンプルな構造と高い信頼性で知られ、世界中で広く使用されている。バランスの取れた性能が特徴。',
    // Handguns
    'Glock 17': 'Glock 17はオーストリアで開発された9mmハンドガン。ポリマーフレームを採用し、軽量で耐久性が高い。世界中の警察や軍隊で広く使用されている。',
    'M1911': 'M1911はアメリカで開発された.45ACPハンドガン。100年以上の歴史を持つ名銃で、その威力と信頼性は伝説的。現在でも多くの愛好家に愛されている。',
    'SIG P226': 'SIG P226はスイスのSIG社が開発した9mmハンドガン。高い精度と信頼性で知られ、多くの特殊部隊で採用されている。バランスの取れた性能が特徴。',
    'Beretta 92': 'Beretta 92はイタリアで開発された9mmハンドガン。アメリカ軍の標準装備として採用され、高い精度と信頼性で知られる。エレガントなデザインも特徴。',
    'FN Five-seveN': 'FN Five-seveNはベルギーのFN社が開発した5.7mmハンドガン。高い貫通力と低反動を実現。特殊部隊でも使用されている高性能なハンドガン。',
    'Desert Eagle': 'Desert Eagleは.50AE弾を使用する大型ハンドガン。その威力は極めて大きく、反動も非常に大きい。映画やゲームでよく登場する伝説的なハンドガン。'
};

// BGM管理
function playBGM() {
    // 既にBGMが再生中の場合は何もしない
    if (state.bgmAudio && !state.bgmAudio.paused) {
        return;
    }
    
    // BGMを停止
    stopBGM();
    
    // 新しいBGMを開始
    state.bgmAudio = new Audio('bgm/game.mp3');
    state.bgmAudio.loop = true;
    state.bgmAudio.volume = 0.15; // BGM音量（小さめ）
    
    state.bgmAudio.play().catch(err => {
        console.log('BGMの再生に失敗しました:', err);
    });
}

function stopBGM() {
    if (state.bgmAudio) {
        state.bgmAudio.pause();
        state.bgmAudio.currentTime = 0;
    }
}

// 画面遷移管理
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    state.currentScreen = screenName;
    
    // ゲーム画面以外に遷移する場合はキャンバスをクリア
    if (screenName !== 'game') {
        clearCanvas();
    }
    
    // BGM制御
    if (screenName === 'op' || screenName === 'mode-select' || screenName === 'weapon-select' || screenName === 'result') {
        // メニュー、モード選択、武器選択、リザルト画面ではBGMを再生
        playBGM();
    } else if (screenName === 'game') {
        // ゲーム画面ではBGMを停止
        stopBGM();
    }
}

// OP画面の初期化
function initOPScreen() {
    document.getElementById('start-btn').addEventListener('click', () => {
        showScreen('mode-select');
        initModeSelect();
    });
}

// モード選択画面の初期化
function initModeSelect() {
    // モードカードのクリックイベント
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode');
            state.selectedMode = mode;
            showScreen('weapon-select');
            renderWeaponSelect();
        });
    });
    
    // 戻るボタン
    const backBtn = document.getElementById('back-to-op-from-mode-btn');
    if (backBtn) {
        // 既存のイベントリスナーを削除するため、クローンして置き換え
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        
        newBackBtn.addEventListener('click', () => {
            showScreen('op');
        });
    }
}

// 武器選択画面のレンダリング
function renderWeaponSelect() {
    const categories = [...new Set(weapons.map(w => w.category))];
    const categoriesDiv = document.getElementById('weapon-categories');
    const weaponListDiv = document.getElementById('weapon-list');
    
    categoriesDiv.innerHTML = '';
    weaponListDiv.innerHTML = '';
    
    let selectedCategory = categories[0];
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        // カテゴリ名を日本語に変換
        btn.textContent = categoryNames[category] || category;
        if (category === selectedCategory) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            selectedCategory = category;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderWeaponList(selectedCategory);
        });
        categoriesDiv.appendChild(btn);
    });
    
    renderWeaponList(selectedCategory);
    
    const backToModeBtn = document.getElementById('back-to-mode-btn');
    if (backToModeBtn) {
        // 既存のイベントリスナーを削除するため、クローンして置き換え
        const newBackBtn = backToModeBtn.cloneNode(true);
        backToModeBtn.parentNode.replaceChild(newBackBtn, backToModeBtn);
        
        newBackBtn.addEventListener('click', () => {
            showScreen('mode-select');
        });
    }
}

function renderWeaponList(category) {
    const weaponListDiv = document.getElementById('weapon-list');
    weaponListDiv.innerHTML = '';
    
    const categoryWeapons = weapons.filter(w => w.category === category);
    
    categoryWeapons.forEach(weapon => {
        const card = document.createElement('div');
        card.className = 'weapon-card';
        if (state.selectedWeapon && state.selectedWeapon.name === weapon.name) {
            card.classList.add('selected');
        }
        
        const imagePath = getWeaponImagePath(weapon.name);
        const description = weaponDescriptions[weapon.name] || '説明なし';
        
        card.innerHTML = `
            ${imagePath ? `<img src="${imagePath}" alt="${weapon.name}" class="weapon-image">` : ''}
            <h3>${weapon.name}</h3>
            <div class="weapon-stats">
                <div>RPM: ${weapon.rpm}</div>
                <div>モード: ${weapon.modes.join(', ')}</div>
                <div>基礎スコア: ${weapon.baseScore}</div>
            </div>
            <div class="weapon-tooltip">${description}</div>
        `;
        
        card.addEventListener('click', () => {
            state.selectedWeapon = weapon;
            document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // 武器選択後、少し待ってからゲーム開始
            setTimeout(() => {
                startGame();
            }, 500);
        });
        
        weaponListDiv.appendChild(card);
    });
}

// ゲーム開始
function startGame() {
    if (!state.selectedWeapon) {
        alert('武器を選択してください');
        return;
    }
    
    showScreen('game');
    startCountdown();
}

// カウントダウン開始
function startCountdown() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    
    if (!countdownOverlay || !countdownNumber) {
        // カウントダウン要素が存在しない場合は直接ゲーム開始
        initGame();
        return;
    }
    
    // カウントダウン表示
    countdownOverlay.style.display = 'flex';
    
    let count = 3;
    countdownNumber.textContent = count;
    
    // 最初のカウント音を再生
    playCountSound();
    
    const countdownInterval = setInterval(() => {
        count--;
        
        if (count > 0) {
            countdownNumber.textContent = count;
            // カウント音を再生
            playCountSound();
            // アニメーション効果
            countdownNumber.style.transform = 'scale(1.2)';
            setTimeout(() => {
                countdownNumber.style.transform = 'scale(1)';
            }, 100);
        } else {
            // カウントダウン終了
            countdownNumber.textContent = 'GO!';
            countdownNumber.style.transform = 'scale(1.5)';
            
            setTimeout(() => {
                countdownOverlay.style.display = 'none';
                countdownNumber.style.transform = 'scale(1)';
                clearInterval(countdownInterval);
                // ゲーム開始
                initGame();
            }, 500);
        }
    }, 1000);
}

// カウントダウン音を再生
function playCountSound() {
    const audio = new Audio('se/count.wav');
    audio.volume = 0.7;
    audio.play().catch(error => {
        console.error('カウントダウン音の再生に失敗しました:', error);
    });
}

function initGame() {
    // 前回のゲームループを停止
    state.gameLoopRunning = false;
    state.gameEnded = false;
    
    // キャンバスをクリア（前回の描画を削除）
    clearCanvas();
    
    // クロスヘアの色を読み込み
    const savedColor = localStorage.getItem('crosshairColor');
    if (savedColor) {
        state.crosshairColor = savedColor;
    }
    updateCrosshairColor();
    
    state.gameStartTime = Date.now();
    state.shots = [];
    state.currentSpread = 0;
    state.lastShotTime = null;
    state.bulletHoles = [];
    state.wallBulletHoles = []; // 木の壁の銃痕をクリア
    state.isMouseDown = false;
    state.currentRecoilY = 0;
    state.currentRecoilX = 0;
    state.baseCrosshairY = 0;
    state.baseCrosshairX = 0;
    state.isScoped = false;
    state.viewOffsetX = 0;
    state.viewOffsetY = 0;
    state.scopeCenterX = 0;
    state.scopeCenterY = 0;
    
    // スコープオーバーレイを非表示にする
    updateScopeDisplay();
    
    const canvas = document.getElementById('game-canvas');
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    
    // キャンバスサイズ設定
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // クロスヘアを画面中央に初期化
        state.crosshairPosition = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        state.mousePosition = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        state.baseCrosshairY = canvas.height / 2;
        state.baseCrosshairX = canvas.width / 2;
        state.currentRecoilY = 0;
        state.currentRecoilX = 0;
        state.isScoped = false;
        state.viewOffsetX = 0;
        state.viewOffsetY = 0;
        state.scopeCenterX = canvas.width / 2;
        state.scopeCenterY = canvas.height / 2;
        // スナイパーライフル選択時は的を小さくする
        if (state.selectedWeapon && state.selectedWeapon.category === 'Sniper Rifles') {
            state.targetRadius = 25; // 通常の半分
        } else {
            state.targetRadius = 50; // 通常サイズ
        }
        updateCrosshair();
        moveTarget();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // モード別の初期化
    if (state.selectedMode === 'target') {
        // 的撃ちモード：通常のターゲット初期化
        state.targetPosition = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        state.targetStartPosition = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        moveTarget();
    } else if (state.selectedMode === 'moving') {
        // 移動標的モード：人型ターゲットを初期化
        initMovingTargets();
        // 移動標的モード背景画像を読み込み
        if (!state.targetModeBgImage) {
            state.targetModeBgImage = new Image();
            state.targetModeBgImage.src = 'img/target_mode_bg.png';
        }
    } else if (state.selectedMode === 'bouncing') {
        // バウンドモード：ボールを初期化
        initBouncingBalls();
        // バウンドモード背景画像を読み込み
        if (!state.boundModeBgImage) {
            state.boundModeBgImage = new Image();
            state.boundModeBgImage.src = 'img/bound_mode_bg.png';
        }
    }
    
    // マウス移動イベント
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isFirstMove = true;
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // クロスヘアはマウスに追従
        state.mousePosition = {
            x: canvasX,
            y: canvasY
        };
        state.baseCrosshairY = canvasY;
        state.baseCrosshairX = canvasX;
        
        updateCrosshair();
    });
    
    // 右クリックイベント（無効化）
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // マウスダウン/アップイベント（連射用）
    canvas.addEventListener('mousedown', (e) => {
        // 右クリック（button === 2）では発射しない
        if (e.button === 2) {
            return;
        }
        
        state.isMouseDown = true;
        const weapon = state.selectedWeapon;
        if (weapon && weapon.modes.includes('auto')) {
            // 自動連射開始
            handleShoot(); // 最初の1発
            startAutoFire();
        } else {
            // セミオート
            handleShoot();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        state.isMouseDown = false;
        stopAutoFire();
    });
    
    canvas.addEventListener('mouseleave', () => {
        state.isMouseDown = false;
        stopAutoFire();
    });
    
    // タッチイベント（モバイル対応）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;
        
        // クロスヘア位置を更新
        state.mousePosition = {
            x: canvasX,
            y: canvasY
        };
        state.baseCrosshairY = canvasY;
        state.baseCrosshairX = canvasX;
        updateCrosshair();
        
        // 発射
        state.isMouseDown = true;
        const weapon = state.selectedWeapon;
        if (weapon && weapon.modes.includes('auto')) {
            handleShoot();
            startAutoFire();
        } else {
            handleShoot();
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;
        
        // クロスヘア位置を更新
        state.mousePosition = {
            x: canvasX,
            y: canvasY
        };
        state.baseCrosshairY = canvasY;
        state.baseCrosshairX = canvasX;
        
        updateCrosshair();
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        state.isMouseDown = false;
        stopAutoFire();
    });
    
    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        state.isMouseDown = false;
        stopAutoFire();
    });
    
    // キーボードイベント
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!state.isMouseDown) {
                state.isMouseDown = true;
                const weapon = state.selectedWeapon;
                if (weapon && weapon.modes.includes('auto')) {
                    handleShoot();
                    startAutoFire();
                } else {
                    handleShoot();
                }
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            state.isMouseDown = false;
            stopAutoFire();
        }
    });
    
    // クロスヘア色選択ボタン
    const colorButtons = document.querySelectorAll('.crosshair-color-btn');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-color');
            state.crosshairColor = color;
            localStorage.setItem('crosshairColor', color);
            updateCrosshairColor();
        });
    });
    
    // ゲーム中断ボタン（重複登録を防ぐ）
    const quitBtn = document.getElementById('quit-game-btn');
    if (quitBtn) {
        // 既存のイベントリスナーを削除（cloneNodeで新しい要素に置き換える）
        const newQuitBtn = quitBtn.cloneNode(true);
        quitBtn.parentNode.replaceChild(newQuitBtn, quitBtn);
        
        // 新しいイベントリスナーを追加
        newQuitBtn.addEventListener('click', () => {
            if (state.gameEnded) return; // 既に終了している場合は何もしない
            
            if (confirm('ゲームを終了しますか？')) {
                state.gameEnded = true;
                stopAutoFire();
                state.gameLoopRunning = false;
                endGame();
            }
        });
    }
    
    // ゲームループ開始
    state.gameLoopRunning = true;
    gameLoop();
    
    // HUD更新（武器画像も含む）
    updateHUD();
}

function startAutoFire() {
    if (state.autoFireInterval) return;
    const weapon = state.selectedWeapon;
    if (!weapon || !weapon.modes.includes('auto')) return;
    
    state.autoFireInterval = setInterval(() => {
        if (state.isMouseDown && state.currentScreen === 'game') {
            handleShoot();
        } else {
            stopAutoFire();
        }
    }, weapon.fireIntervalMs);
}

function stopAutoFire() {
    if (state.autoFireInterval) {
        clearInterval(state.autoFireInterval);
        state.autoFireInterval = null;
    }
}

function moveTarget() {
    const margin = state.targetRadius + 50;
    // HUDの領域を避ける（上部のHUDエリア）
    const hudTopHeight = 220; // 上部HUDの高さ（余裕を持たせる）
    const hudBottomHeight = 50; // 下部の余白（メニュー画面との重なりを防ぐ）
    const hudLeftWidth = 280; // 左側のHUDの幅（余裕を持たせる）
    
    // 現在位置を開始位置として保存
    state.targetStartPosition = {
        x: state.targetPosition.x || (state.canvas.width / 2),
        y: state.targetPosition.y || (state.canvas.height / 2)
    };
    
    // 新しい目標位置（HUDエリアを避ける）
    let newX, newY;
    let attempts = 0;
    do {
        // 安全な範囲内でランダムに配置
        newX = margin + Math.random() * (state.canvas.width - margin * 2);
        newY = hudTopHeight + margin + Math.random() * (state.canvas.height - hudTopHeight - hudBottomHeight - margin * 2);
        attempts++;
        // 左上のHUDエリア外か、または試行回数が多すぎる場合は強制的に配置
    } while (newX < hudLeftWidth && newY < hudTopHeight + margin && attempts < 50);
    
    state.targetEndPosition = {
        x: newX,
        y: newY
    };
    state.targetMoveStartTime = Date.now();
    state.targetMovedAt = Date.now();
}

function handleShoot() {
    if (state.currentScreen !== 'game') return;
    
    const now = Date.now();
    const weapon = state.selectedWeapon;
    
    // 連射制限チェック
    if (state.lastShotTime && (now - state.lastShotTime) < weapon.fireIntervalMs) {
        return;
    }
    
    // 効果音再生
    try {
        playShotSound(weapon);
    } catch (error) {
        console.error('playShotSound呼び出しエラー:', error);
    }
    
    // スプレッド計算
    const timeSinceLastShot = state.lastShotTime ? (now - state.lastShotTime) : 1000;
    
    // スプレッド回復
    state.currentSpread = Math.max(0, state.currentSpread - (timeSinceLastShot * weapon.spreadRecoverPerMs));
    
    // スプレッド増加
    state.currentSpread += weapon.spreadGrowPx;
    
    // 反動を追加（連射時は累積）
    // Y軸反動（上方向）
    state.currentRecoilY += weapon.recoilVertical;
    // X軸反動（左右のぶれ）
    const horizontalRecoil = weapon.recoilHorizontal || 0;
    const randomDirection = Math.random() < 0.5 ? -1 : 1; // ランダムに左右
    state.currentRecoilX += horizontalRecoil * randomDirection * (0.5 + Math.random() * 0.5); // ランダムな強度
    
    // 発射時のブレ計算
    const totalSpread = weapon.spreadBasePx + state.currentSpread;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * totalSpread;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    // 着弾点（クロスヘア位置から発射）
    const baseHitX = state.crosshairPosition.x;
    const baseHitY = state.crosshairPosition.y;
    
    // スプレッドと反動を加えた着弾点
    const hitX = baseHitX + dx;
    const hitY = baseHitY + dy;
    
    // モード別の命中判定
    let hit = false;
    let score = 0;
    let centerBonus = 0;
    let reactionMs = null;
    let distanceToTarget = 0; // すべてのモードで定義
    let hitWall = false; // 木の壁にヒットしたかどうか
    
    if (state.selectedMode === 'target') {
        // 的撃ちモード：通常の円形ターゲット判定
        distanceToTarget = Math.sqrt(
            Math.pow(hitX - state.targetPosition.x, 2) + 
            Math.pow(hitY - state.targetPosition.y, 2)
        );
        
        hit = distanceToTarget <= state.targetRadius;
        
        if (hit) {
            reactionMs = now - state.targetMovedAt;
            centerBonus = 1 - (distanceToTarget / state.targetRadius);
            score = Math.round(weapon.baseScore * (0.2 + 0.8 * centerBonus));
            moveTarget();
        }
    } else if (state.selectedMode === 'moving') {
        // 移動標的モード：木の壁の判定（左右20%）
        const leftWallWidth = state.canvas.width * 0.2;
        const rightWallStart = state.canvas.width * 0.8;
        
        if (hitX < leftWallWidth) {
            // 左の壁にヒット
            hitWall = true;
            state.wallBulletHoles.push({
                x: hitX,
                y: hitY,
                time: now,
                side: 'left'
            });
        } else if (hitX > rightWallStart) {
            // 右の壁にヒット
            hitWall = true;
            state.wallBulletHoles.push({
                x: hitX,
                y: hitY,
                time: now,
                side: 'right'
            });
        }
        
        // 木の壁にヒットしていない場合のみターゲット判定
        if (!hitWall) {
            // 移動標的モード：人型ターゲット判定（中心を撃つほど高得点）
            for (let target of state.movingTargets) {
                const scale = target.depth;
                const width = 150 * scale;
                const height = 200 * scale;
                
                // 簡易的な矩形判定
                if (hitX >= target.x - width * 0.5 && hitX <= target.x + width * 0.5 &&
                    hitY >= target.y - height * 0.5 && hitY <= target.y + height * 0.5) {
                    hit = true;
                    
                    // 中心からの距離を計算（0.0〜1.0）
                    const distanceToCenter = Math.sqrt(
                        Math.pow((hitX - target.x) / (width * 0.5), 2) + 
                        Math.pow((hitY - target.y) / (height * 0.5), 2)
                    );
                    
                    // 距離を記録
                    distanceToTarget = Math.sqrt(
                        Math.pow(hitX - target.x, 2) + 
                        Math.pow(hitY - target.y, 2)
                    );
                    
                    // 中心に近いほど高得点（二乗を使ってより中心を重視）
                    // distanceToCenterが0（中心）なら1.0、1（端）なら0に近づく
                    const distanceRatio = Math.min(1.0, distanceToCenter);
                    centerBonus = Math.pow(1.0 - distanceRatio, 2); // 二乗で中心をより重視
                    centerBonus = Math.max(0.1, centerBonus); // 最低でも10%のスコア
                    
                    // 奥行きと中心からの距離を考慮
                    score = Math.round(weapon.baseScore * centerBonus * (0.5 + target.depth * 0.5));
                    reactionMs = 500; // 固定値
                    
                    // 銃痕を記録（ターゲット上の相対位置）
                    target.bulletHoles.push({
                        offsetX: hitX - target.x,
                        offsetY: hitY - target.y,
                        time: now
                    });
                    
                    break;
                }
            }
        }
    } else if (state.selectedMode === 'bouncing') {
        // バウンドモード：風船判定（割ると得点）
        for (let ball of state.balls) {
            if (!ball.destroyed) {
                distanceToTarget = Math.sqrt(
                    Math.pow(hitX - ball.x, 2) + 
                    Math.pow(hitY - ball.y, 2)
                );
                
                if (distanceToTarget <= ball.radius) {
                    hit = true;
                    // 風船を割ると固定得点
                    score = weapon.baseScore;
                    centerBonus = 1.0; // 固定値
                    reactionMs = 300; // 固定値
                    
                    // 風船を破裂させる
                    ball.destroyed = true;
                    ball.destroyedTime = now;
                    break;
                }
            }
        }
    }
    
    // 銃弾の跡を記録（木の壁にヒットしていない場合のみ）
    if (!hitWall) {
        state.bulletHoles.push({
            x: hitX,
            y: hitY,
            time: now,
            hit: hit
        });
    }
    
    // ショットログ記録
    const shotLog = {
        time: now,
        weapon: weapon.name,
        hit: hit,
        score: score,
        reactionMs: reactionMs,
        distancePx: distanceToTarget,
        centerBonus: centerBonus
    };
    
    state.shots.push(shotLog);
    state.lastShotTime = now;
    
    // 反動によるクロスヘアの動き（視覚的フィードバック）
    if (hit) {
        // ヒット時の視覚効果（後でグラフィック差し替え可能）
        console.log(`Hit! Score: ${score}, Reaction: ${reactionMs}ms`);
    } else {
        console.log('Miss');
    }
    
    updateHUD();
}

function playShotSound(weapon) {
    // 画像ファイル名から効果音ファイル名を取得
    const imagePath = getWeaponImagePath(weapon.name);
    let soundFile = 'se/shot.wav'; // デフォルト（WAV形式）
    
    if (imagePath) {
        // 画像パスからファイル名（拡張子なし）を取得
        // 例: 'img/ar/m4a1.png' -> 'm4a1'
        const imageFileName = imagePath.split('/').pop().replace('.png', '');
        
        // 特別なマッピング（画像ファイル名と効果音ファイル名が異なる場合）
        const soundFileMap = {
            'deserteagle50ae': 'deserteagle50ae_1',
            'ak74': 'ak47' // ak74.wavがない場合はak47.wavを使用
        };
        
        // マッピングがあればそれを使用、なければ画像ファイル名をそのまま使用
        const soundFileName = soundFileMap[imageFileName] || imageFileName;
        
        // SEファイルのパスを構築
        soundFile = `se/${soundFileName}.wav`;
        
        console.log(`武器: ${weapon.name}, 効果音: ${soundFile}`);
    }
    
    // 武器ごとの音響パラメータを取得
    const volume = weapon.soundVolume !== undefined ? weapon.soundVolume : 0.5;
    const playbackRate = weapon.soundPlaybackRate !== undefined ? weapon.soundPlaybackRate : 1.0;
    
    // Audio要素を作成（通常のAudio APIのみ使用）
    const audio = new Audio(soundFile);
    
    // エラーハンドリング
    audio.addEventListener('error', (e) => {
        console.error('音声ファイルの読み込みエラー:', soundFile);
        console.error('エラー詳細:', audio.error);
    });
    
    // 音量と再生速度を設定
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    
    // 再生
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // 再生成功
        }).catch(error => {
            console.error('効果音の再生に失敗しました:', error);
            console.error('音声ファイル:', soundFile);
        });
    }
}

// 各武器のイコライザー設定を取得
function getWeaponEQSettings(weapon) {
    // デフォルト設定
    const defaultSettings = {
        lowGain: 0,      // 低音域（60-250Hz）
        midLowGain: 0,   // 中低音域（250-500Hz）
        midGain: 0,      // 中音域（500-2000Hz）
        midHighGain: 0,  // 中高音域（2000-4000Hz）
        highGain: 0      // 高音域（4000-8000Hz）
    };
    
    // 武器名またはカテゴリに基づいて設定を返す
    const weaponName = weapon.name;
    const category = weapon.category;
    
    // アサルトライフル: 中音域と高音域を強調（明瞭度とアタック感）
    if (category === 'Assault Rifles') {
        if (weaponName === 'AK-47' || weaponName === 'Galil') {
            // 7.62mm系: 低音域も強調（重厚感）
            return {
                lowGain: 4,
                midLowGain: 3,
                midGain: 5,
                midHighGain: 4,
                highGain: 2
            };
        } else if (weaponName === 'FAMAS') {
            // 高ROF: 高音域を強調（鋭さ）
            return {
                lowGain: 1,
                midLowGain: 2,
                midGain: 4,
                midHighGain: 6,
                highGain: 5
            };
        } else {
            // 標準アサルトライフル（M4A1、HK416など）
            return {
                lowGain: 1,
                midLowGain: 2,
                midGain: 4,
                midHighGain: 5,
                highGain: 3
            };
        }
    }
    
    // サブマシンガン: 高音域を強調（鋭さと軽快さ）
    if (category === 'Submachine Guns') {
        if (weaponName === 'Vector') {
            // 反動低減システム: 高音域を強調、低音域は控えめ
            return {
                lowGain: -2,
                midLowGain: 1,
                midGain: 3,
                midHighGain: 7,
                highGain: 6
            };
        } else if (weaponName === 'MAC-10') {
            // 極端に高ROF: 高音域を強調
            return {
                lowGain: 0,
                midLowGain: 1,
                midGain: 3,
                midHighGain: 8,
                highGain: 7
            };
        } else if (weaponName === 'UMP45') {
            // .45ACP: 低音域も強調
            return {
                lowGain: 5,
                midLowGain: 3,
                midGain: 3,
                midHighGain: 4,
                highGain: 2
            };
        } else {
            // 標準サブマシンガン（MP5、MP7など）
            return {
                lowGain: -1,
                midLowGain: 1,
                midGain: 3,
                midHighGain: 6,
                highGain: 5
            };
        }
    }
    
    // ハンドガン
    if (category === 'Handguns') {
        if (weaponName === 'Desert Eagle') {
            // .50AE: 低音域を大幅に強調（重厚感と迫力）
            return {
                lowGain: 12,
                midLowGain: 8,
                midGain: 4,
                midHighGain: -2,
                highGain: -5
            };
        } else if (weaponName === 'M1911') {
            // .45ACP: 低音域を強調
            return {
                lowGain: 6,
                midLowGain: 4,
                midGain: 3,
                midHighGain: 1,
                highGain: -2
            };
        } else if (weaponName === 'FN Five-seveN') {
            // 5.7mm: 高音域を強調（軽快さ）
            return {
                lowGain: -2,
                midLowGain: 0,
                midGain: 2,
                midHighGain: 5,
                highGain: 4
            };
        } else {
            // 標準ハンドガン（9mm系）
            return {
                lowGain: 2,
                midLowGain: 2,
                midGain: 3,
                midHighGain: 2,
                highGain: 1
            };
        }
    }
    
    // スナイパーライフル: 低音域を強調（重厚感と迫力）
    if (category === 'Sniper Rifles') {
        if (weaponName === 'Barrett M82') {
            // .50BMG: 極めて低音域を強調
            return {
                lowGain: 15,
                midLowGain: 10,
                midGain: 5,
                midHighGain: -3,
                highGain: -6
            };
        } else if (weaponName === 'AWM') {
            // .300WM: 低音域を強調
            return {
                lowGain: 11,
                midLowGain: 7,
                midGain: 4,
                midHighGain: -2,
                highGain: -4
            };
        } else {
            // 標準スナイパーライフル（.308Win系）
            return {
                lowGain: 9,
                midLowGain: 6,
                midGain: 3,
                midHighGain: -1,
                highGain: -3
            };
        }
    }
    
    return defaultSettings;
}

function updateCrosshair() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        // 反動を考慮したクロスヘア位置（X軸とY軸の両方）
        state.crosshairPosition = {
            x: state.baseCrosshairX + state.currentRecoilX,
            y: state.baseCrosshairY + state.currentRecoilY
        };
        crosshair.style.left = state.crosshairPosition.x + 'px';
        crosshair.style.top = state.crosshairPosition.y + 'px';
        // スコープモード時はクロスヘアを非表示
        if (state.isScoped) {
            crosshair.style.display = 'none';
        } else {
            crosshair.style.display = 'block';
        }
    }
}

// クロスヘアの色を更新
function updateCrosshairColor() {
    const crosshair = document.getElementById('crosshair');
    if (!crosshair) return;
    
    let color;
    switch (state.crosshairColor) {
        case 'yellowgreen':
            color = 'rgba(154, 205, 50, 0.9)'; // 黄緑
            break;
        case 'magenta':
            color = 'rgba(255, 0, 255, 0.9)'; // マゼンタ
            break;
        default:
            color = 'rgba(255, 255, 255, 0.8)'; // 白（デフォルト）
    }
    
    // CSS変数または直接スタイルで設定
    crosshair.style.setProperty('--crosshair-color', color);
    
    // 既存のスタイルを上書き
    const style = document.createElement('style');
    style.id = 'crosshair-color-style';
    const existingStyle = document.getElementById('crosshair-color-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    style.textContent = `
        .crosshair::before,
        .crosshair::after {
            background: ${color} !important;
        }
    `;
    document.head.appendChild(style);
    
    // ボタンの選択状態を更新
    document.querySelectorAll('.crosshair-color-btn').forEach(btn => {
        if (btn.getAttribute('data-color') === state.crosshairColor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateScopeDisplay() {
    const scopeOverlay = document.getElementById('scope-overlay');
    if (scopeOverlay) {
        if (state.isScoped) {
            scopeOverlay.style.display = 'block';
        } else {
            scopeOverlay.style.display = 'none';
            // スコープモード終了時に視点オフセットをリセット
            state.viewOffsetX = 0;
            state.viewOffsetY = 0;
        }
    }
    // クロスヘアの表示も更新
    updateCrosshair();
}

function gameLoop() {
    // ゲームループが停止されている、またはゲーム画面でない場合は終了
    if (!state.gameLoopRunning || state.currentScreen !== 'game' || state.gameEnded) {
        state.gameLoopRunning = false;
        return;
    }
    
    const now = Date.now();
    const elapsed = now - state.gameStartTime;
    const remaining = Math.max(0, state.gameDuration - elapsed);
    
    // 時間切れチェック
    if (remaining <= 0) {
        if (!state.gameEnded) {
            state.gameEnded = true;
            state.gameLoopRunning = false;
            stopAutoFire();
            endGame();
        }
        return;
    }
    
    // 反動の回復処理
    updateRecoil();
    
    // モード別の更新処理
    if (state.selectedMode === 'target') {
        // ターゲットのイーズ移動更新
        updateTargetPosition();
    } else if (state.selectedMode === 'moving') {
        // 移動標的の更新
        updateMovingTargets();
    } else if (state.selectedMode === 'bouncing') {
        // バウンドボールの更新
        updateBouncingBalls();
    }
    
    // クロスヘア位置更新（反動反映）
    updateCrosshair();
    
    // 描画
    draw();
    
    // HUD更新
    updateHUD();
    
    // 次のフレームをスケジュール
    requestAnimationFrame(() => gameLoop());
}

function updateRecoil() {
    if (!state.selectedWeapon) return;
    
    const weapon = state.selectedWeapon;
    const now = Date.now();
    const timeSinceLastShot = state.lastShotTime ? (now - state.lastShotTime) : 1000;
    
    // 反動回復（撃たない時間で回復）
    if (timeSinceLastShot > 50) { // 50ms以上撃っていない場合のみ回復
        const recoveryAmount = timeSinceLastShot * weapon.recoilRecoveryPerMs;
        state.currentRecoilY = Math.max(0, state.currentRecoilY - recoveryAmount);
        // X軸反動も回復（Y軸より少し遅く）
        state.currentRecoilX *= Math.pow(0.95, timeSinceLastShot / 16); // フレームベースの減衰
        if (Math.abs(state.currentRecoilX) < 0.1) {
            state.currentRecoilX = 0;
        }
    }
}

function updateTargetPosition() {
    if (!state.targetMoveStartTime) return;
    
    const now = Date.now();
    const elapsed = now - state.targetMoveStartTime;
    const progress = Math.min(elapsed / state.targetMoveDuration, 1);
    
    // イージング関数（easeOutCubic）
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // 現在位置を計算
    state.targetPosition = {
        x: state.targetStartPosition.x + (state.targetEndPosition.x - state.targetStartPosition.x) * easeProgress,
        y: state.targetStartPosition.y + (state.targetEndPosition.y - state.targetStartPosition.y) * easeProgress
    };
}

// 移動標的モード：初期化
function initMovingTargets() {
    state.movingTargets = [];
    
    // ターゲット画像を読み込み
    const targetImage = new Image();
    targetImage.src = 'img/target.png';
    
    // 壁画像を読み込み
    state.wallImage = new Image();
    state.wallImage.src = 'img/wall.png';
    
    // 3つの人型ターゲットを異なる奥行きで生成（ランダムで左右どちらからも）
    for (let i = 0; i < 3; i++) {
        const depth = 0.4 + i * 0.3; // 0.4, 0.7, 1.0（奥から手前へ）
        const y = state.canvas.height * (0.4 + i * 0.15); // 高さを分散
        const lane = Math.random() < 0.5 ? 'left' : 'right'; // ランダムで左右を決定
        const baseSpeed = 1.5 + depth * 2.5; // 奥は遅く（1.5）、手前は速く（4.0）
        
        let startX, speed;
        if (lane === 'left') {
            // 左から右へ
            startX = -200 - Math.random() * 300;
            speed = baseSpeed; // 正の値（右へ移動）
        } else {
            // 右から左へ
            startX = state.canvas.width + 200 + Math.random() * 300;
            speed = -baseSpeed; // 負の値（左へ移動）
        }
        
        state.movingTargets.push({
            x: startX,
            y: y,
            depth: depth,
            speed: speed,
            lane: lane,
            image: targetImage,
            bulletHoles: [] // このターゲットに付いた銃痕
        });
    }
}

// 移動標的モード：更新
function updateMovingTargets() {
    state.movingTargets.forEach(target => {
        target.x += target.speed;
        
        // 画面外に出たら反対側から再出現
        if (target.lane === 'left' && target.x > state.canvas.width + 200) {
            // 左から右へ移動していて、右側に消えた場合
            target.lane = Math.random() < 0.5 ? 'left' : 'right'; // ランダムで方向を変更
            target.y = state.canvas.height * (0.4 + Math.random() * 0.3);
            target.depth = 0.4 + Math.random() * 0.6; // 0.4〜1.0
            const baseSpeed = 1.5 + target.depth * 2.5;
            
            if (target.lane === 'left') {
                target.x = -200 - Math.random() * 300;
                target.speed = baseSpeed;
            } else {
                target.x = state.canvas.width + 200 + Math.random() * 300;
                target.speed = -baseSpeed;
            }
            target.bulletHoles = []; // 銃痕をクリア
        } else if (target.lane === 'right' && target.x < -200) {
            // 右から左へ移動していて、左側に消えた場合
            target.lane = Math.random() < 0.5 ? 'left' : 'right'; // ランダムで方向を変更
            target.y = state.canvas.height * (0.4 + Math.random() * 0.3);
            target.depth = 0.4 + Math.random() * 0.6; // 0.4〜1.0
            const baseSpeed = 1.5 + target.depth * 2.5;
            
            if (target.lane === 'left') {
                target.x = -200 - Math.random() * 300;
                target.speed = baseSpeed;
            } else {
                target.x = state.canvas.width + 200 + Math.random() * 300;
                target.speed = -baseSpeed;
            }
            target.bulletHoles = []; // 銃痕をクリア
        }
    });
}

// バウンドモード：風船の色リスト
const balloonColors = [
    'rgba(255, 100, 100, 1)',
    'rgba(100, 255, 100, 1)',
    'rgba(100, 100, 255, 1)',
    'rgba(255, 255, 100, 1)',
    'rgba(255, 100, 255, 1)',
    'rgba(100, 255, 255, 1)',
    'rgba(255, 150, 100, 1)',
    'rgba(200, 100, 255, 1)',
    'rgba(255, 200, 100, 1)',
    'rgba(100, 255, 200, 1)'
];

// バウンドモード：初期化（風船）
function initBouncingBalls() {
    state.balls = [];
    // 10個の風船を生成
    for (let i = 0; i < 10; i++) {
        createNewBalloon();
    }
}

// バウンドモード：新しい風船を1個生成（画面外から）
function createNewBalloon() {
    const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
    let x, y, vx, vy;
    
    switch(side) {
        case 0: // 上から
            x = Math.random() * state.canvas.width;
            y = -50;
            vx = (Math.random() - 0.5) * 6;
            vy = Math.random() * 3 + 2; // 下向き
            break;
        case 1: // 右から
            x = state.canvas.width + 50;
            y = Math.random() * state.canvas.height;
            vx = -(Math.random() * 3 + 2); // 左向き
            vy = (Math.random() - 0.5) * 6;
            break;
        case 2: // 下から
            x = Math.random() * state.canvas.width;
            y = state.canvas.height + 50;
            vx = (Math.random() - 0.5) * 6;
            vy = -(Math.random() * 3 + 2); // 上向き
            break;
        case 3: // 左から
            x = -50;
            y = Math.random() * state.canvas.height;
            vx = Math.random() * 3 + 2; // 右向き
            vy = (Math.random() - 0.5) * 6;
            break;
    }
    
    state.balls.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: 30 + Math.random() * 20,
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        destroyed: false,
        destroyedTime: 0
    });
}

// バウンドモード：更新（風船は重力なしで永遠にバウンド）
function updateBouncingBalls() {
    const bounce = 1.0; // 完全弾性衝突（エネルギーロスなし）
    const maxBalloons = 10; // 最大風船数
    
    state.balls.forEach(ball => {
        if (!ball.destroyed) {
            // 位置更新（重力なし）
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // 壁との衝突判定（完全弾性衝突）
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx = Math.abs(ball.vx);
            }
            if (ball.x + ball.radius > state.canvas.width) {
                ball.x = state.canvas.width - ball.radius;
                ball.vx = -Math.abs(ball.vx);
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy);
            }
            if (ball.y + ball.radius > state.canvas.height) {
                ball.y = state.canvas.height - ball.radius;
                ball.vy = -Math.abs(ball.vy);
            }
        }
    });
    
    // 破裂した風船を削除（0.5秒後）とカウント
    const now = Date.now();
    const beforeCount = state.balls.length;
    state.balls = state.balls.filter(ball => {
        if (ball.destroyed) {
            return now - ball.destroyedTime < 500;
        }
        return true;
    });
    const afterCount = state.balls.length;
    const removedCount = beforeCount - afterCount;
    
    // 削除された風船の数だけ新しい風船を画面外から補充
    for (let i = 0; i < removedCount; i++) {
        if (state.balls.filter(b => !b.destroyed).length < maxBalloons) {
            createNewBalloon();
        }
    }
    
    // 現在の風船数が最大数より少ない場合も補充（安全策）
    const activeBalloons = state.balls.filter(b => !b.destroyed).length;
    if (activeBalloons < maxBalloons) {
        const needed = maxBalloons - activeBalloons;
        for (let i = 0; i < needed; i++) {
            createNewBalloon();
        }
    }
}

// 的撃ちモード：静止ターゲット描画
function drawStaticTarget(ctx) {
    // ターゲット描画（グラデーション付き）
    const gradient = ctx.createRadialGradient(
        state.targetPosition.x, state.targetPosition.y, 0,
        state.targetPosition.x, state.targetPosition.y, state.targetRadius
    );
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 68, 68, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(state.targetPosition.x, state.targetPosition.y, state.targetRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // ターゲット外枠
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.targetPosition.x, state.targetPosition.y, state.targetRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // ターゲット中心
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(state.targetPosition.x, state.targetPosition.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // ターゲット内部の同心円（視認性向上）
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.targetPosition.x, state.targetPosition.y, state.targetRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // ターゲット内部の小さな円
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.targetPosition.x, state.targetPosition.y, state.targetRadius * 0.25, 0, Math.PI * 2);
    ctx.stroke();
}

// 移動標的モード：人型ターゲット描画
function drawMovingTargets(ctx) {
    const canvas = state.canvas;
    const now = Date.now();
    
    // ターゲットを奥行き順にソート（奥から手前へ描画）
    const sortedTargets = [...state.movingTargets].sort((a, b) => a.depth - b.depth);
    
    // ターゲットを先に描画
    sortedTargets.forEach(target => {
        const scale = target.depth; // 奥行きによるスケール（0.4〜1.0）
        const width = 150 * scale; // 画像の幅
        const height = 200 * scale; // 画像の高さ
        
        ctx.save();
        
        // ターゲット画像を描画（右から左へ移動する場合は反転）
        if (target.image && target.image.complete) {
            if (target.lane === 'right') {
                // 右から左へ移動する場合は画像を反転
                ctx.translate(target.x, target.y);
                ctx.scale(-1, 1); // 水平反転
                ctx.drawImage(
                    target.image,
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );
            } else {
                // 左から右へ移動する場合は通常描画
                ctx.drawImage(
                    target.image,
                    target.x - width / 2,
                    target.y - height / 2,
                    width,
                    height
                );
            }
        }
        
        // ctx.restore()を先に実行してから銃痕を描画
        ctx.restore();
        
        // 銃痕を描画（座標変換の影響を受けないように）
        target.bulletHoles = target.bulletHoles.filter(hole => {
            const age = now - hole.time;
            // 10秒間表示
            if (age > 10000) return false;
            
            // 銃痕を描画（ターゲット上の相対位置）
            const holeX = target.x + hole.offsetX * scale;
            const holeY = target.y + hole.offsetY * scale;
            
            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            ctx.beginPath();
            ctx.arc(holeX, holeY, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            // 銃痕の周りに放射状の線
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.6)';
            ctx.lineWidth = 1 * scale;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                ctx.beginPath();
                ctx.moveTo(holeX, holeY);
                ctx.lineTo(
                    holeX + Math.cos(angle) * 6 * scale,
                    holeY + Math.sin(angle) * 6 * scale
                );
                ctx.stroke();
            }
            
            return true;
        });
    });
    
    // 木の壁を後から描画（前面に表示）
    if (state.wallImage && state.wallImage.complete) {
        // 左側の壁
        const leftWallWidth = canvas.width * 0.2;
        const leftWallHeight = canvas.height;
        ctx.drawImage(state.wallImage, 0, 0, leftWallWidth, leftWallHeight);
        
        // 右側の壁
        const rightWallWidth = canvas.width * 0.2;
        const rightWallHeight = canvas.height;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // 水平反転
        ctx.drawImage(state.wallImage, 0, 0, rightWallWidth, rightWallHeight);
        ctx.restore();
    }
    
    // 木の壁の銃痕を描画（最前面）
    state.wallBulletHoles = state.wallBulletHoles.filter(hole => {
        const age = now - hole.time;
        // 10秒間表示
        if (age > 10000) return false;
        
        // 銃痕を描画
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 銃痕の周りに放射状の線
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.moveTo(hole.x, hole.y);
            ctx.lineTo(
                hole.x + Math.cos(angle) * 6,
                hole.y + Math.sin(angle) * 6
            );
            ctx.stroke();
        }
        
        return true;
    });
}

// バウンドモード：風船描画
function drawBouncingBalls(ctx) {
    state.balls.forEach(ball => {
        if (!ball.destroyed) {
            // 風船のグラデーション（光沢感）
            const gradient = ctx.createRadialGradient(
                ball.x - ball.radius * 0.4, ball.y - ball.radius * 0.4, 0,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.3, ball.color);
            gradient.addColorStop(1, ball.color.replace('1)', '0.4)'));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 風船の外枠
            ctx.strokeStyle = ball.color.replace('1)', '0.8)');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 風船の結び目（下部の三角形）
            ctx.fillStyle = ball.color.replace('1)', '0.6)');
            ctx.beginPath();
            ctx.moveTo(ball.x - 5, ball.y + ball.radius);
            ctx.lineTo(ball.x + 5, ball.y + ball.radius);
            ctx.lineTo(ball.x, ball.y + ball.radius + 10);
            ctx.closePath();
            ctx.fill();
            
            // ハイライト（光沢）
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.3,
                ball.radius * 0.3,
                ball.radius * 0.2,
                -Math.PI / 4,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            // 破裂エフェクト（風船が割れる）
            const elapsed = Date.now() - ball.destroyedTime;
            const progress = elapsed / 500; // 0.5秒で消える
            if (progress < 1) {
                ctx.save();
                ctx.globalAlpha = 1 - progress;
                
                // 破片を描画
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 / 12) * i;
                    const dist = ball.radius * progress * 3;
                    const x = ball.x + Math.cos(angle) * dist;
                    const y = ball.y + Math.sin(angle) * dist;
                    
                    // ランダムな形の破片
                    ctx.fillStyle = ball.color;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle + progress * Math.PI);
                    ctx.fillRect(-5, -3, 10 * (1 - progress), 6 * (1 - progress));
                    ctx.restore();
                }
                ctx.restore();
            }
        }
    });
}

// キャンバスをクリアする関数
function clearCanvas() {
    if (state.canvas && state.ctx) {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    }
}

// 背景画像をアスペクト比を保ちながらカバー表示（CSS background-size: cover 相当）
function drawBackgroundCover(ctx, image, canvasWidth, canvasHeight) {
    const imgWidth = image.width;
    const imgHeight = image.height;
    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = imgWidth / imgHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (canvasRatio > imgRatio) {
        // キャンバスの方が横長：幅に合わせる
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
    } else {
        // キャンバスの方が縦長：高さに合わせる
        drawWidth = canvasHeight * imgRatio;
        drawHeight = canvasHeight;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
    }
    
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function draw() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;
    
    // 背景描画（モード別）
    if (state.selectedMode === 'moving' && state.targetModeBgImage && state.targetModeBgImage.complete) {
        // 移動標的モード：背景画像をアスペクト比を保ちながらカバー
        drawBackgroundCover(ctx, state.targetModeBgImage, canvas.width, canvas.height);
    } else if (state.selectedMode === 'bouncing' && state.boundModeBgImage && state.boundModeBgImage.complete) {
        // バウンドモード：背景画像をアスペクト比を保ちながらカバー
        drawBackgroundCover(ctx, state.boundModeBgImage, canvas.width, canvas.height);
    } else {
        // その他のモード：白とグレーのグラデーション
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGradient.addColorStop(0, '#ffffff');
        bgGradient.addColorStop(0.5, '#e0e0e0');
        bgGradient.addColorStop(1, '#c0c0c0');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 銃弾の跡を描画
    const now = Date.now();
    state.bulletHoles = state.bulletHoles.filter(hole => {
        const age = now - hole.time;
        // 5秒間表示
        if (age > 5000) return false;
        
        // 銃弾の跡を描画
        ctx.fillStyle = hole.hit ? 'rgba(255, 255, 0, 0.8)' : 'rgba(200, 200, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // ヒット時は外側に円を描画
        if (hole.hit) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        return true;
    });
    
    // モードに応じた描画
    if (state.selectedMode === 'target') {
        // 的撃ちモード：通常のターゲット描画
        drawStaticTarget(ctx);
    } else if (state.selectedMode === 'moving') {
        // 移動標的モード：人型ターゲット描画
        drawMovingTargets(ctx);
    } else if (state.selectedMode === 'bouncing') {
        // バウンドモード：ボール描画
        drawBouncingBalls(ctx);
    }
    
}

function updateHUD() {
    if (state.currentScreen !== 'game') return;
    
    const now = Date.now();
    const elapsed = now - state.gameStartTime;
    const remaining = Math.max(0, Math.ceil((state.gameDuration - elapsed) / 1000));
    
    document.getElementById('time-remaining').textContent = remaining;
    
    const totalScore = state.shots.reduce((sum, shot) => sum + shot.score, 0);
    document.getElementById('current-score').textContent = totalScore;
    
    const lastShot = state.shots[state.shots.length - 1];
    if (lastShot && lastShot.hit) {
        document.getElementById('reaction-time').textContent = lastShot.reactionMs;
    } else {
        document.getElementById('reaction-time').textContent = '-';
    }
    
    const hitShots = state.shots.filter(s => s.hit).length;
    const hitRate = state.shots.length > 0 ? Math.round((hitShots / state.shots.length) * 100) : 0;
    document.getElementById('hit-rate').textContent = hitRate + '%';
    
    // 武器画像と名前を更新
    const weaponImagePath = getWeaponImagePath(state.selectedWeapon.name);
    const weaponDisplayImg = document.getElementById('weapon-display-image');
    const weaponDisplayName = document.getElementById('weapon-display-name');
    
    if (weaponImagePath && weaponDisplayImg) {
        weaponDisplayImg.src = weaponImagePath;
        weaponDisplayImg.alt = state.selectedWeapon.name;
        weaponDisplayImg.style.display = 'block';
        
        // 武器名を画像の下に表示
        if (weaponDisplayName) {
            weaponDisplayName.textContent = state.selectedWeapon.name;
            weaponDisplayName.style.display = 'block';
        }
    } else if (weaponDisplayImg) {
        weaponDisplayImg.style.display = 'none';
        if (weaponDisplayName) {
            weaponDisplayName.style.display = 'none';
        }
    }
}

function endGame() {
    // 既に終了処理が実行されている場合は何もしない
    if (state.gameEnded && state.currentScreen === 'result') {
        return;
    }
    
    state.gameEnded = true;
    state.gameLoopRunning = false;
    stopAutoFire();
    
    // キャンバスをクリア
    clearCanvas();
    
    // 終了音を再生
    playEndSound();
    
    // 終了演出を表示
    showEndEffect();
    
    // スコープモードをリセット
    state.isScoped = false;
    state.viewOffsetX = 0;
    state.viewOffsetY = 0;
    state.scopeCenterX = 0;
    state.scopeCenterY = 0;
    updateScopeDisplay();
    
    // 少し遅延してからリザルト画面に遷移
    setTimeout(() => {
        showScreen('result');
        renderResult();
    }, 1500);
}

// 終了音を再生
function playEndSound() {
    const audio = new Audio('se/end.wav');
    audio.volume = 0.7;
    audio.play().catch(error => {
        console.error('終了音の再生に失敗しました:', error);
    });
}

// 終了演出を表示
function showEndEffect() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    
    if (!countdownOverlay || !countdownNumber) {
        return;
    }
    
    // 終了演出を表示
    countdownOverlay.style.display = 'flex';
    countdownNumber.textContent = '終了';
    countdownNumber.style.fontSize = '8rem';
    countdownNumber.style.transform = 'scale(1)';
    
    // 1.5秒後に非表示
    setTimeout(() => {
        countdownOverlay.style.display = 'none';
        countdownNumber.style.fontSize = '15rem'; // 元のサイズに戻す
    }, 1500);
}

function renderResult() {
    const hitShots = state.shots.filter(s => s.hit);
    const totalScore = state.shots.reduce((sum, shot) => sum + shot.score, 0);
    const hitRate = state.shots.length > 0 ? Math.round((hitShots.length / state.shots.length) * 100) : 0;
    
    const reactionTimes = hitShots.map(s => s.reactionMs).filter(ms => ms !== null);
    const avgReaction = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce((sum, ms) => sum + ms, 0) / reactionTimes.length)
        : null;
    const fastestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
    
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('avg-reaction').textContent = avgReaction !== null ? avgReaction : '-';
    document.getElementById('fastest-reaction').textContent = fastestReaction !== null ? fastestReaction : '-';
    document.getElementById('result-hit-rate').textContent = hitRate + '%';
    
    // ショットログ表示
    const shotLogDiv = document.getElementById('shot-log');
    shotLogDiv.innerHTML = '';
    
    if (state.shots.length === 0) {
        shotLogDiv.innerHTML = '<div style="padding: 1rem; text-align: center; color: #aaa;">ショットログがありません</div>';
    } else {
        state.shots.forEach((shot, index) => {
            const logItem = document.createElement('div');
            logItem.className = `shot-log-item ${shot.hit ? 'hit' : 'miss'}`;
            
            const timeStr = new Date(shot.time - state.gameStartTime).toISOString().substr(14, 8);
            
            logItem.innerHTML = `
                <span>#${index + 1}</span>
                <span>${timeStr}</span>
                <span>${shot.hit ? '✓ ヒット' : '✗ ミス'}</span>
                <span>スコア: ${shot.score}</span>
                <span>${shot.reactionMs !== null ? `反応: ${shot.reactionMs}ms` : '-'}</span>
                <span>距離: ${Math.round(shot.distancePx)}px</span>
            `;
            
            shotLogDiv.appendChild(logItem);
        });
    }
    
    // ボタンイベント
    document.getElementById('retry-btn').addEventListener('click', () => {
        startGame();
    });
    
    document.getElementById('back-to-mode-select-btn').addEventListener('click', () => {
        showScreen('mode-select');
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // クロスヘアの色を読み込み
    const savedColor = localStorage.getItem('crosshairColor');
    if (savedColor) {
        state.crosshairColor = savedColor;
    }
    updateCrosshairColor();
    initOPScreen();
    showScreen('op');
    // OP画面でBGMを開始
    playBGM();
});

