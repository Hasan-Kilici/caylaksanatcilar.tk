let socket = io();

let gonderiForm = document.getElementById("gonderiForm")
let users = {
username: "<%= user.username %>",
id : "<%= user._id %>",
}

gonderiForm.addEventListener("submit", (e)=>{
  socket.emit("gonder", users)
})
socket.on("gonder", (data)=>{
  console.log("gönderi geldi")
})
