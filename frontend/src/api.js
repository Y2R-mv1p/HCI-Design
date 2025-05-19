export const detectSeats = async (imageData, seats) => {
    const formData = new FormData()
    formData.append('image', dataURLtoFile(imageData))
    formData.append('seats', JSON.stringify(seats))
  
    const response = await fetch('http://localhost:8000/api/detect', {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
  
  const dataURLtoFile = (dataurl) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new File([u8arr], 'frame.jpg', { type: mime })
  }