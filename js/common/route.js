;(function($){
	var Route = function( list){
		this.list		= list || {};		//	路由表
		this.animation	= false;
		this.status		= 'reload';
		this.module 	= '#';				//	默认模块
		this.title 		= '';				//	默认标题
		this.status		= 'forward';
		this.timeout	= 3000;				//	默认超时时间
		this.history	= true;				//	是否记录到history
		this.onAfter 	= function(){};
		this.onProgress	= function(){};
		this.onBefore	= function(){};
		this.onTimeout	= function(){};
		this.onSuccess	= function(){};
		this.onError	= function(){};
	}

	Route.prototype = {
		/**
		 * 载入模块
		 * @param {Object} o
		 */
		go: function( o){
			if( this.animation){
				return false;
			}
			var o			= o || {},
				_s	 		= {};
			_s.animation= this.animation;
			_s.module 	= typeof o.module != 'undefined'? o.module: this.module;
			_s.title 	= typeof o.title != 'undefined'? o.title: this.title;
			_s.data 	= typeof o.data != 'undefined'? o.data: {};
			_s.timeout 	= !isNaN( o.timeout)? o.timeout: this.timeout;
			_s.history	= typeof o.history != 'undefined'? o.history: this.history;
			_s.status	= typeof o.status != 'undefined'? o.status: this.status;
			_s.onAfter	= typeof o.onAfter == 'function'? o.onAfter: this.onAfter;
			_s.onProgress= typeof o.onProgress == 'function'? o.onProgress: this.onProgress;
			_s.onBefore	= typeof o.onBefore == 'function'? o.onBefore: this.onBefore;
			_s.onTimeout= typeof o.onTimeout == 'function'? o.onTimeout: this.onTimeout;
			_s.onSuccess= typeof o.onSuccess == 'function'? o.onSuccess: this.onSuccess;
			_s.onError	= typeof o.onError == 'function'? o.onError: this.onError;
//			_s.url		= this.getModule( _s.module);
			
			//	获取模块资源并运行前置回调函数
			if( typeof this.list[ _s.module] == 'string'){
				_s.url = this.list[ _s.module];
			}else if( typeof this.list[ _s.module] == 'object'){
				var m = this.list[ _s.module];
				if( typeof m.onBefore == 'function'){
					if( false === m.onBefore(o.module)){
						return false;
					}
				}
				_s.m = m;
				_s.url = m.template_url;
				_s.onLoad = typeof m.onLoad == 'function'? m.onLoad: function(){};
				delete m;
			}
			
			if( !_s.url){
				console.error( _s.module+' 模块未定义!');
				return false;
			}
			var xhr = new XMLHttpRequest(),
				timedout = false,
				timer = setTimeout( function(){
					timedout = true;
					xhr.abort();
				}, _s.timeout);
			xhr.open( 'GET', _s.url, false);
			xhr.setRequestHeader("Cache-Control","no-cache");
			_s.onBefore();
			xhr.onprogress = function(e){ _s.onProgress(e);};
			xhr.onreadystatechange = function(e){
				if( timedout){
					_s.onTimeout();
					return false;
				}else if( xhr.readyState === 4){
					if( xhr.status === 200){
						if( _s.history){
							var p = _s.module+'?',
								data = _s.data;
							for( var k in data){
								p += k+'='+data[k]+'&';
							}
							p = p.substr( 0, p.length - 1);
							a = location.href.indexOf('#');
							if( a > -1){
								url = location.href.substring( 0, a)+p;
							}else{
								url = location.href.split("?")[0]+p;
							}
							history.pushState( data, _s.title+parseInt( ( Math.random() * 100)), url);
						}
						_s.onSuccess( xhr.responseText);
					}else{
						_s.onError( xhr.status, xhr.statusText);
					}
				}
				_s.onAfter();
			}
			xhr.send();
			return xhr;
		},
		back: function(){
			this.status = 'back';
			history.back();
			popup.hide();
		},
		forward: function(){
			this.status = 'forward';
			history.forward();
		},
		/**
		 * 获取模块资源位置
		 * @param {Object} m
		 */
		getModule: function( m){
			if( this.list[m]){
				return this.list[m];
			}
			return this.list['default'];
		},
		/**
		 * 重置模块资源位置
		 * @param {Object} list
		 */
		setModule: function( list){
			for( var k in list){
				this.list[k] = list[k];
			}
		},
		/**
		 * 全局配置
		 * @param {Object} o
		 */
		setup: function(o){
			this.module 	= typeof o.module != 'undefined'? o.module: o.module;
			this.title 		= typeof o.title != 'undefined'? o.title: o.title;
			this.timeout 	= !isNaN( o.timeout)? o.timeout: o.timeout;
			this.onAfter	= typeof o.onAfter == 'function'? o.onAfter: this.onAfter;
			this.onProgress	= typeof o.onProgress == 'function'? o.onProgress: this.onProgress;
			this.onBefore	= typeof o.onBefore == 'function'? o.onBefore: this.onBefore;
			this.onTimeout	= typeof o.onTimeout == 'function'? o.onTimeout: this.onTimeout;
			this.onSuccess	= typeof o.onSuccess == 'function'? o.onSuccess: this.onSuccess;
			this.onError	= typeof o.onError == 'function'? o.onError: this.onError;
		}
	};
	
	$.route = new Route();
	
	window.addEventListener( 'popstate', function(e){
		$.route.go({
			module: location.hash.split('?')[0] || '#',
			history: false,
			status: $.route.status
		});
	});
})(this);
