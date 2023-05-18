/*
 * @Author: xjh
 * @Date: 2023-05-16 17:50:04
 * @LastEditors: xjh
 * @LastEditTime: 2023-05-18 16:07:07
 * @Description: 
 */

const images = []

// 合并图层，filterText:是否过滤文本图层
const complieGroup = (group, filterText = false, ctx) => {
	const lays = group.children().reverse()
	if (!ctx) {
		ctx = document.createElement('canvas').getContext('2d')
		ctx.canvas.width = group.width
		ctx.canvas.height = group.height
	}
	lays.forEach((la) => {
		const childrenInfo = la.export()
		if (childrenInfo.type === 'group') {
			complieGroup(la, filterText, ctx)
		} else if (filterText ? la.visible() && !childrenInfo.text : la.visible()) {
			const layerImage = la.toPng()
			images.push(layerImage)
			ctx.globalAlpha = la.layer.image.opacity
			layerImage.onload = () => {
				ctx.drawImage(layerImage, childrenInfo.left, childrenInfo.top)
				const allComplete = images.find(d => !d.complete)
			}
		}
	})
	return ctx.canvas
}

const fileChange = () => {
	const file = document.getElementById("upload").files[0]
	psd.fromDroppedFile(file).then(async(psd) => {
		const dom1 = document.getElementById("fullscreen")
		const dom2 = document.getElementById("fullscreenWithoutText")
		const dom3 = document.getElementById("images")
		dom1.innerHTML = ''
		dom2.innerHTML = ''
		dom3.innerHTML = ''
		const descendantsList = psd.tree().descendants()
		dom1.appendChild(complieGroup(psd.tree()))
		dom2.appendChild(complieGroup(psd.tree(), true))
		descendantsList.reverse()
		for (let i = 0; i < descendantsList.length; i++) {
		  if (descendantsList[i].isGroup()) continue
		  if (!descendantsList[i].visible()) continue
		  try {
			const data = descendantsList[i].export()
			if (!data.text) {
				dom3.appendChild(descendantsList[i].toPng())
			}
		  } catch (e) {
			// 转换不出来的图层先忽略
			console.log(e)
			continue
		  }
		}
	})
}

const download = () => {
	const dom1 = document.getElementById("fullscreen")
	const dom2 = document.getElementById("fullscreenWithoutText")
	const dom3 = document.getElementById("images")
	const zip = new JSZip()
	const zipName = "images"
	const fileFolder = zip.folder(zipName)
	const fileList = []
	let fileCount = 0
	for (let i = 0; i < dom1.children.length; i++) {
		saveFileZip(dom1.children[i].toDataURL('image/png'), ++fileCount + '.png')
	}
	for (let i = 0; i < dom2.children.length; i++) {
		saveFileZip(dom2.children[i].toDataURL('image/png'), ++fileCount + '.png')
	}
	for (let i = 0; i < dom3.children.length; i++) {
		saveFileZip(dom3.children[i].src, ++fileCount + '.png')
	}

	function saveFileZip(url, name){
		const xhr = new XMLHttpRequest()
		xhr.open('get', url, true)
		xhr.responseType = 'blob' // 二进制对象，binary
		xhr.onload = function () {
			const blob = xhr.response // response 属性返回响应的正文，取决于 responseType 属性。
			fileList.push({name: name, content: blob})
			if (fileList.length === fileCount) {
				if (fileList.length) {
					for (let k = 0; k < fileList.length; k++) {
						// 往文件夹中，添加个文件的数据
						fileFolder.file(fileList[k].name, fileList[k].content, {
							binary: true //二进制
						})
					}
					zip.generateAsync({type: 'blob'}).then(function(content){
						saveAs(content, zipName + '.zip')
					})
				}
			}
		}
		xhr.send(null)
	}
}
