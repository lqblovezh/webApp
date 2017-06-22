;(function(O){
	var R = function(){
		this._list = {};
	};
	
	R.prototype = {
		setList: function( n){
			this._list = n;
		},
		go: function( n, data){
			var data = data || {};
			this.load( n, data);
			data.m_id = n;
			history.pushState( data, n, this.resetUrlParam( data));
		},
		forward: function(){
			history.forward();
		},
		back: function(){
			history.back();
		},
		resetUrlParam: function( o){
			var url = location.href,
				u = url.split('?'),
				list = {},
				str = '?';
			if( typeof(u[1]) == 'string'){
				p = u[1].split('&');
				for( var k in p){
					var n = p[k].split('=');
					if( n[0] == 'm_id'){
						list[n[0]] = n[1];
					}
				}
			}
			for( var k in o){
				list[k] = o[k];
			}
			for( var k in list){
				str += k+'='+list[k]+'&';
			}
			str = str.substr( 0, str.length - 1);
			return str;
		},
		setUrlParam: function( o){
			var url = location.href,
				u = url.split('?'),
				list = {},
				str = '?';
			if( typeof(u[1]) == 'string'){
				p = u[1].split('&');
				for( var k in p){
					var n = p[k].split('=');
					list[n[0]] = n[1];
				}
			}
			for( var k in o){
				list[k] = o[k];
			}
			for( var k in list){
				str += k+'='+list[k]+'&';
			}
			str = str.substr( 0, str.length - 1);
			return u[0]+str;
		},
		getUrlParam: function( name){
			var url = location.href,
				u = url.split('?'),
				list = {},
				str = '?';
			if( typeof(u[1]) == 'string'){
				p = u[1].split('&');
				for( var k in p){
					var n = p[k].split('=');
					list[n[0]] = n[1];
				}
			}
			return list[name] || false;
		},
		load: function( id, param){
			var m_id = id || this.getUrlParam('m_id') || 'home_index',
				url = this._getUrl( m_id);
			if( !url){
				console.error( 'm_id 为 '+m_id+' 没有指定地址！');
				return false;
			}
			var xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true);
			xhr.timeout = 3000;

			xhr.onloadstart = function(){
				$('#progress').show();
			    $('#progress .rail').css( 'width', '20%');
			}
			xhr.onloadend = function(){
				$('#progress .rail').css( 'width', '100%');
				$("#progress").hide();
			}
			xhr.onerror = function( xhr, ajaxOptions, thrownError){
				console.error( xhr.responseText);
			    console.error( thrownError);
			}
			xhr.ontimeout = function( e){
				debugger;
			}
			xhr.onprogress = function(e){
				if( e.lengthComputable){
					var w = Math.round( 100 * e.loaded / e.total);
					w > 20 && $('#progress .rail').css( 'width', w+'%');
				}
			}
			xhr.onload = function( data){
				$('#lay').empty().append( data.target.response);
			}
			xhr.send();
			
		},
		_getUrl: function( a){
			if( this._list[a]){
				return this._list[a];
			}else{
				return false;
			}
		}
	};
	O.R = new R();
	
	window.addEventListener( 'popstate', function(){
		O.R.load();
	});
})(this);
