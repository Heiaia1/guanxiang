const androidDownloadUrl = '/download/android';
const releasePageUrl = 'https://github.com/Heiaia1/guanxiang/releases/latest';

const features = [
  { number: '01', title: '三种观象方式', description: '情境观象、今日观象与三枚铜钱互动，按你的当下需要选择。' },
  { number: '02', title: '完整周易内容', description: '六十四卦、三百八十四爻与二十四篇札记，均可离线阅读。' },
  { number: '03', title: '隐私留在本机', description: '无需登录、没有广告、无联网权限，问题与记录只保存在你的手机。' },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="主导航">
        <a className="brand" href="#top" aria-label="观象录首页">
          <span className="brand-mark" aria-hidden="true">䷀</span><span>观象录</span>
        </a>
        <div className="nav-links">
          <a href="#features">功能</a><a href="#install">安装说明</a>
          <a className="nav-download" href={androidDownloadUrl}>下载 App</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Android 免费版 · v1.1.0</p>
          <h1>观照当下，<br /><em>自有答案。</em></h1>
          <p className="hero-description">一款以《周易》为文化背景的个人反思工具。不是预测未来，而是帮你看清处境、整理思路，找到下一步行动。</p>
          <div className="hero-actions">
            <a className="primary-button" href={androidDownloadUrl}>
              <span className="android-icon" aria-hidden="true">↓</span>
              <span><strong>下载 Android App</strong><small>支持 Android 7.0 及以上</small></span>
            </a>
            <a className="text-link" href={releasePageUrl} target="_blank" rel="noreferrer">查看版本详情 <span aria-hidden="true">↗</span></a>
          </div>
          <ul className="trust-row" aria-label="应用特点"><li>完全免费</li><li>无需登录</li><li>断网可用</li></ul>
        </div>

        <div className="hero-visual" aria-label="观象录 App 界面示意">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="seal" aria-hidden="true">观<br />象</div>
          <div className="phone">
            <div className="phone-speaker" />
            <div className="phone-screen">
              <div className="app-topline"><span>观象录</span><i /></div>
              <p className="app-date">甲辰 · 七月廿一</p><p className="app-greeting">静下来，看看此刻</p>
              <div className="hexagram" aria-hidden="true"><b /><b /><b className="broken" /><b /><b className="broken" /><b /></div>
              <h2>风火家人</h2><p className="app-caption">诚意 · 秩序 · 各安其位</p>
              <button type="button" tabIndex={-1}>开始观象</button>
              <div className="app-nav"><span>今日</span><span>问事</span><span>札记</span></div>
            </div>
          </div>
          <p className="vertical-note" aria-hidden="true">以古观今 · 知止而后定</p>
        </div>
      </section>

      <section className="manifesto">
        <div className="shell manifesto-inner">
          <p>我们不替你做决定</p>
          <blockquote>“答案不在卦中，<br />而在你重新看见的自己。”</blockquote>
          <span>观象录只提供另一种观看当下的角度</span>
        </div>
      </section>

      <section className="features shell" id="features">
        <div className="section-heading"><p className="eyebrow"><span /> 不止于起卦</p><h2>一处安静的<br />自省空间</h2></div>
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
        <div><p className="eyebrow light"><span /> 即刻开始</p><h2>把片刻清明，<br />装进口袋。</h2></div>
        <div className="install-steps">
          <ol><li><span>1</span>点击下载 Android 安装包</li><li><span>2</span>按手机提示允许本次安装</li><li><span>3</span>安装完成后即可断网使用</li></ol>
          <a className="primary-button light-button" href={androidDownloadUrl}>
            <span className="android-icon" aria-hidden="true">↓</span><span><strong>免费下载 APK</strong><small>v1.1.0 · Android 7.0+</small></span>
          </a>
        </div>
      </section>

      <footer className="shell footer">
        <div className="brand"><span className="brand-mark" aria-hidden="true">䷀</span><span>观象录</span></div>
        <p>传统文化学习与个人反思工具<br />不用于预测、诊断或替代专业意见</p>
        <div className="footer-links"><a href="https://github.com/Heiaia1/guanxiang/blob/main/docs/privacy-policy.md">隐私说明</a><a href="https://github.com/Heiaia1/guanxiang">项目源码</a></div>
      </footer>
    </main>
  );
}
