const stayLengths = () => {
  let timeStr: number

  let pathname: string

  let statistics: Array<{
    name: string,
    time: number
  }> = []

  const rewriteHis = (type: string) => {
    let origin = window.history[type as keyof typeof window.history]
    return function () {
      // @ts-ignore
      let rs = origin.apply(this, arguments)
      let e: {arguments?: IArguments, [key:string]: any} = new Event(type.toLocaleLowerCase())
      e.arguments = arguments
      window.dispatchEvent(e as Event)
      return rs
    }
  }

  // 统一处理
  const dealData = () => {
    let t = new Date().getTime() - timeStr
    timeStr = new Date().getTime()
    console.log('待了时长' + t)
    statistics.push({
      name: pathname,
      time: t
    })

    pathname = window.location.pathname.split('/').pop() || ''
  }

  const formatDuring = (data: number) => {
    let s
    let hours = parseInt(`${(data % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)}`)
    let minutes = parseInt(`${(data % (1000 * 60 * 60)) / (1000 * 60)}`)
    let seconds = (data % (1000 * 60)) / 1000
    s = (hours < 10 ? ('0' + hours) : hours) + '时' + (minutes < 10 ? ('0' + minutes) : minutes) + '分' + (seconds < 10 ? ('0' + seconds) : seconds) + '秒'
    return s
  }

  // 同步请求
  const postSync = (url: string, dataJson = {}) => {
    return new Promise((resolve, reject) => {
    // 1,new
      const oAjax = new XMLHttpRequest()

      // 2,open
      oAjax.open('POST', url, false)// false表示同步请求

      // 3,setHeader,get请求不需要
      oAjax.setRequestHeader('Content-type', 'application/json')

      // 4，定义返回触发的函数，定义在send之前，不然同步请求就出问题
      oAjax.onreadystatechange = function () {
      // 6,通过状态确认完成
        if (oAjax.readyState === 4 && oAjax.status === 200) {
        // 7,获取返回值，解析json格式字符串为对象
          const data = JSON.parse(oAjax.responseText)
          resolve(data)
          return data
        } else {
          console.log(oAjax)
          reject(oAjax)
        }
      }

      // ，5发送
      oAjax.send(JSON.stringify(dataJson))
    })
  }

  const sendBeacon = (url: string, data = {}) => {
    const blob = new Blob([JSON.stringify(data)], {
      type: 'application/json; charset=UTF-8'
    })
    const joinedQueue = navigator.sendBeacon(url, blob)
    console.log('用户代理把数据加入传输队列' + (joinedQueue ? '成功' : '失败'))
    return joinedQueue
  }

  const sendReport = (url: string, data = {}) => {
    if (navigator.sendBeacon as any) { // sendBeacon方法存在兼容性问题，除了IE，大部分浏览器都已经支持
      const joinedQueue: any = sendBeacon(url, data)
      if (!joinedQueue) {
        postSync(url, data)
      }
    } else {
      postSync(url, data)
    }
  }

  window.onpageshow = () => {
    timeStr = new Date().getTime()
    pathname = window.location.pathname.split('/').pop() || ''
  }

  document.addEventListener('visibilitychange', function logData () {
    if (document.visibilityState === 'hidden') {
      dealData()

      // postSync('http://127.0.0.1:3000/datas/addData', data).then((res) => {
      //   console.log(res, 111)
      // })
      console.log(statistics)
      sendReport('http://127.0.0.1:3000/datas/addData', statistics)
    } else if (document.visibilityState === 'visible') { // 如果隐藏页面又显示算作重新开始计算
      timeStr = new Date().getTime()
      statistics = []
    }
  })

  window.history.pushState = rewriteHis('pushState')
  window.history.replaceState = rewriteHis('replaceState')

  window.addEventListener('popstate', (e) => {
    console.log(e, history)
    dealData()
  })

  window.addEventListener('pushstate', (e) => {
    console.log(e, history)
    dealData()
  })

  window.addEventListener('replacestate', () => {
    dealData()
  })

  window.addEventListener('hashchange', () => {
    dealData()
  })
}

export {
  stayLengths
}
