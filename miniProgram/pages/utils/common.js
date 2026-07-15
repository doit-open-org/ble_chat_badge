// 引入 dayjs
// import dayjs from 'dayjs';
const show_success_toast=(text)=>{
  wx.showToast({
    title: text,
    icon:'success'
  })
}
const show_error_toast=(text)=>{
  wx.showToast({
    title: text,
    icon:'error'
  })
}
const show_none_toast=(text)=>{
  wx.showToast({
    title: text,
    icon:'none'
  })
}
const show_loading_toast=(text)=>{
  wx.showToast({
    title: text,
    icon:'loading'
  })
}
// const dateformat=(tim)=>{
//   const formatted1 = dayjs(tim).format('YYYY-MM-DD HH:mm:ss');
//   return formatted1
// }
module.exports ={
  show_error_toast,
  show_none_toast,
  show_success_toast,
  show_loading_toast,
  // dateformat
}