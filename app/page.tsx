const androidDownloadUrl = 'downloads/Guanxiang-Android-v1.1.0.apk';
const iosStatusUrl = 'https://github.com/Heiaia1/guanxiang/blob/main/docs/ios-release-readme.md';

const features = [
  { number: '01', title: '三种观象方式', description: '情境观象、今日观象与三枚铜钱互动，按你的当下需要选择。' },
  { number: '02', title: '九宫式信息秩序', description: '以方位、时机与进退为视觉线索，把复杂处境整理成可以理解的层次。' },
  { number: '03', title: '隐私留在本机', description: '无需登录、没有广告、无联网权限，问题与记录只保存在你的手机。' },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="主导航">
        <a className="brand" href="#top" aria-label="风后奇门主题首页">
          <span className="brand-mark" aria-hidden="true">九</span><span>风后奇门</span>
        </a>
        <div className="nav-links">
          <a href="#features">功能</a><a href="#install">安装说明</a><a href="#ios">iOS</a>
          <a className="nav-download" href={androidDownloadUrl} download>下载 App</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> 风后奇门主题 · iOS 与 Android</p>
          <h1>风起九宫，<br /><em>门开万象。</em></h1>
          <p className="hero-description">取风后奇门的九宫方位与时空秩序为视觉灵感，帮助你安定心绪、审视处境，找到此刻可以执行的下一步。</p>
          <div className="hero-actions">
            <a className="primary-button" href={androidDownloadUrl} download>
              <span className="android-icon" aria-hidden="true">↓</span>
              <span><strong>下载 Android App</strong><small>支持 Android 7.0 及以上</small></span>
            </a>
            <a className="text-link" href="#ios">查看 iOS 版 <span aria-hidden="true">↓</span></a>
          </div>
          <ul className="trust-row" aria-label="应用特点"><li>完全免费</li><li>无需登录</li><li>断网可用</li></ul>
        </div>

        <div className="hero-visual qimen-visual" aria-label="风后奇门主题界面意象">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="seal" aria-hidden="true">观<br />象</div>
          <div className="phone">
            <div className="phone-speaker" />
            <div className="phone-screen">
              <div className="app-topline"><span>风后奇门</span><i /></div>
              <p className="app-date">甲辰 · 七月廿一 · 巽位</p><p className="app-greeting">定方位 · 观时机 · 明进退</p>
              <div className="qimen-board" aria-hidden="true">
                <b>杜</b><b>景</b><b>死</b><b>伤</b><b className="center">中</b><b>惊</b><b>生</b><b>休</b><b>开</b>
              </div>
              <h2>休门得位</h2><p className="app-caption">静守 · 蓄势 · 先整后动</p>
              <button type="button" tabIndex={-1}>开启九宫</button>
              <div className="app-nav"><span>今日</span><span>问事</span><span>札记</span></div>
            </div>
          </div>
          <p className="vertical-note" aria-hidden="true">以古观今 · 知止而后定</p>
        </div>
      </section>

      <section className="ios-panel shell" id="ios">
        <div>
          <p className="eyebrow"><span /> iPhone · iPad</p>
          <h2>iOS 原生版<br />已进入上架流程</h2>
        </div>
        <div className="ios-copy">
          <p>iOS 版已完成原生应用工程、离线功能、设备图标、隐私清单和 App Store 自动上传流程。正式下载链接将在 Apple 审核通过后开放。</p>
          <ul><li>最低支持 iOS 15</li><li>无需登录，断网可用</li><li>记录只保存在当前设备</li></ul>
          <a className="primary-button ios-button" href={iosStatusUrl} target="_blank" rel="noreferrer">
            <span className="apple-icon" aria-hidden="true"></span><span><strong>查看 iOS 上架进度</strong><small>App Store 审核通过后开放下载</small></span>
          </a>
        </div>
      </section>

      <section className="manifesto">
        <div className="shell manifesto-inner">
          <p>我们不替你做决定</p>
          <blockquote>“九宫定其位，<br />八门察其机。”</blockquote>
          <span>借方位整理处境，借时机审视进退</span>
        </div>
      </section>

      <section className="features shell" id="features">
        <div className="section-heading"><p className="eyebrow"><span /> 九宫 · 八门 · 方位</p><h2>观天时，辨方位，<br />更要看清自己</h2></div>
        <div className="feature-list">
          {features.map((feature) => (
            <article key={feature.number} className="feature-card">
              <span className="feature-number">{feature.number}</span>
              <div><h3>{feature.title}</h3><p>{feature.description}</p></div>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </article>
          ))}
        </div>
      </section>

      <section className="install shell" id="install">
        <div><p className="eyebrow light"><span /> 风后奇门主题版</p><h2>掌中起九宫，<br />心中自有方位。</h2></div>
        <div className="install-steps">
          <ol><li><span>1</span>点击下载 Android 安装包</li><li><span>2</span>按手机提示允许本次安装</li><li><span>3</span>安装完成后即可断网使用</li></ol>
          <a className="primary-button light-button" href={androidDownloadUrl} download>
            <span className="android-icon" aria-hidden="true">↓</span><span><strong>免费下载 APK</strong><small>v1.1.0 · Android 7.0+</small></span>
          </a>
        </div>
      </section>

      <footer className="shell footer">
        <div className="brand"><span className="brand-mark" aria-hidden="true">九</span><span>风后奇门</span></div>
        <p>东方时空观主题 · 传统文化学习与个人反思工具<br />不用于预测、诊断或替代专业意见</p>
        <div className="footer-links"><a href="https://github.com/Heiaia1/guanxiang/blob/main/docs/privacy-policy-ios.md">iOS 隐私</a><a href="https://github.com/Heiaia1/guanxiang">项目源码</a></div>
      </footer>
    </main>
  );
}
