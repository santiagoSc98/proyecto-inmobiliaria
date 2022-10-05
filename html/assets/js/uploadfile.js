	
		var $btn = $('[data-image-uploader-button]')
		var $uploaderApp = $('[data-image-uploader-app]')
		var $uploader = $('[data-image-uploader]')
		var $uploads = $('[data-image-uploads]')
		var $uploaderErrors = $('[data-image-uploader-error]')
		var $uploaderErrorList = $('[data-image-uploader-error-list]')

		var imageFiles = []
		var imageErrors = []

		function addThumbnail(file, index) {
			var $thumbnail = $('<div class="images-holder__thumbnail">')
			var $imgHolder = $('<div class="images-holder__holder">')
			var $img = $('<img class="images-holder__image">')
			var $imgOverlay = $('<div class="images-holder__overlay">')
			var $imgOverlayIcon = $('<span class="glyphicon glyphicon-eye-open">')
			var $title = $('<span class="images-holder__title">')
			var $imgRemove = $('<span data-image-upload="' + index + '" class="images-holder__remove">')
			$img.file = file
			$title.text(file.name)
			$imgHolder.append($img)
			$imgOverlay.append($imgOverlayIcon)
			$imgHolder.append($imgOverlay)
			$thumbnail.append($imgHolder)
			$thumbnail.append($title)
			$thumbnail.append($imgRemove)
			$uploads.append($thumbnail)
			
			var reader = new FileReader()
			reader.onload = (e) => $img[0].src = e.target.result
			reader.readAsDataURL(file)
		}

		function updateThumbnails(files)  {
		
		$uploads.empty()
		
		imageFiles = files
		
		imageFiles.forEach((file, index) => addThumbnail(file, index))  
		
		}

		function getUniqueFiles(files) {
		return files.reduce((unique, file, i) => {
			var findFile = unique.find((u) => u.name === file.name)
			if (findFile === undefined) {
			return unique.concat([file])
			}
			return unique
		}, [])
		}

		function addValidationError(messages) {
		var errorMessageList = messages.map((message) => {
			return $('<li>').text(message)
		})
		}

		function validateImage(file) {
		var valid = /^image\//.test(file.type)
		
		if (!valid) {
			imageErrors.push('Not an image.')
		}
		
		return valid
		}

		function validateImageSize(file) {
		return true
		}

		$uploaderErrors.hide()

		$btn.click(function() {
		$uploader.trigger('click')
		});

		$uploader.change(function() {
		var $this = $(this)
		var files = []
			.slice
			.call($this[0].files)
			.filter(validateImage)
			.filter(validateImageSize)
		
		var thumbnailFiles = getUniqueFiles(imageFiles.concat(files))
		
		updateThumbnails(thumbnailFiles)
		
		});

		$(document).on('click', '[data-image-upload]', function() {
		
		var index = $(this).attr('data-image-upload')
		
		imageFiles.splice(index, 1)
		
		updateThumbnails(imageFiles)
		
		})