import UIKit
import WebKit

final class WebViewController: UIViewController, WKNavigationDelegate, UIGestureRecognizerDelegate {
    private lazy var webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 24 / 255, green: 32 / 255, blue: 32 / 255, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.allowsBackForwardNavigationGestures = false
        view.customUserAgent = "GuanxiangIOS/1.1.0"
        return view
    }()

    private let errorLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        label.isHidden = true
        label.text = "离线内容加载失败\n请重新安装观象录"
        return label
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = webView.backgroundColor
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        view.addSubview(errorLabel)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            errorLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            errorLabel.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            errorLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        installBackGesture()
        loadBundledApp()
    }

    private func loadBundledApp() {
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web"),
              let webRoot = Bundle.main.url(forResource: "web", withExtension: nil) else {
            showLoadError()
            return
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
    }

    private func installBackGesture() {
        let gesture = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleBackGesture(_:)))
        gesture.edges = .left
        gesture.delegate = self
        view.addGestureRecognizer(gesture)
    }

    @objc private func handleBackGesture(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended else { return }
        let translation = gesture.translation(in: view)
        guard translation.x > 60 else { return }
        webView.evaluateJavaScript("window.GX_NATIVE_BACK ? window.GX_NATIVE_BACK() : false")
    }

    private func showLoadError() {
        webView.isHidden = true
        errorLabel.isHidden = false
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showLoadError()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showLoadError()
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        decisionHandler(url.isFileURL ? .allow : .cancel)
    }
}
