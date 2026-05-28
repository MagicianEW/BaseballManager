import { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * Error Boundary Component
 * Catches React component errors and displays a friendly fallback UI
 * instead of crashing the entire application with a white screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚾</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">页面加载出错</h1>
              <p className="text-gray-600 mb-6">
                抱歉，页面发生了一些问题。请尝试刷新或返回首页。
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 p-4 rounded mb-4 text-sm overflow-auto">
                  <summary className="cursor-pointer font-semibold mb-2">错误详情 (开发模式)</summary>
                  <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="whitespace-pre-wrap mt-2 text-xs text-red-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="bg-green-800 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  返回首页
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-500"
                >
                  刷新页面
                </button>
              </div>
              <Link to="/login" className="block mt-4 text-blue-600 hover:underline">
                返回登录页
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary