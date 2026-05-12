import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 轮询 Hook - 用于定期刷新数据
 * @param {Function} fetchFn - 获取数据的函数
 * @param {number} interval - 轮询间隔(ms)
 * @param {boolean} enabled - 是否启用轮询
 */
export function usePolling(fetchFn, interval = 2000, enabled = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)

  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    const fetch = async () => {
      try {
        setLoading(true)
        const result = await fetchRef.current()
        setData(result)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetch()
    const timer = setInterval(fetch, interval)

    return () => clearInterval(timer)
  }, [interval, enabled])

  return { data, loading, error }
}

/**
 * 表单 Hook - 简化表单处理
 * @param {Object} initialValues - 初始值
 */
export function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const validate = useCallback((rules) => {
    const newErrors = {}
    let isValid = true

    for (const [field, rule] of Object.entries(rules)) {
      const value = values[field]
      if (rule.required && !value) {
        newErrors[field] = '此字段必填'
        isValid = false
      }
      if (rule.validator && !rule.validator(value)) {
        newErrors[field] = rule.message || '验证失败'
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [values])

  return { values, errors, handleChange, setValue, reset, validate }
}

/**
 * 选择 Hook - 管理单选/多选
 * @param {Array} options - 选项列表
 */
export function useSelect(options = []) {
  const [selected, setSelected] = useState(null)

  const select = useCallback((option) => {
    setSelected(option)
  }, [])

  const clear = useCallback(() => {
    setSelected(null)
  }, [])

  const isSelected = useCallback((option) => {
    return selected === option
  }, [selected])

  return { selected, select, clear, isSelected }
}

/**
 * 展开/折叠 Hook
 */
export function useExpand(initialState = false) {
  const [expanded, setExpanded] = useState(initialState)

  const toggle = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const expand = useCallback(() => {
    setExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setExpanded(false)
  }, [])

  return { expanded, toggle, expand, collapse }
}