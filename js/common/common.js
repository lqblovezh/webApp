Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
var runtime = {
	begin: function(){
		this._begin = new Date().getTime();
	},
	end: function(){
		this._end = new Date().getTime();
		if( this._end && this._begin){
			console.log( ( this._end - this._begin) / 1000 +'s');
		}
	}
};
/**
 * 页面公共方法
 */
var we_chat = {
	/**
	 * 判断用户是否已登录
	 * @return {Boolean}
	 */
	isLogin: function(){
		if( we_chat.getStorage("user_id") ){
			return true;
		}
		return false;
	},
	
	//get url info val---->支持string&ohject
	getUrl			: function (val) {
        var uri = window.location.href;
		if(typeof val == "string"){
			var search_arry = "";
	        var re = new RegExp("[\&|\?]" + val + "\=([^\&\?]*)", "ig");
			search_arry = (uri.match(re)) ? (uri.match(re)[0].substr(val.length + 2)) : null;
		}else if($.isArray(val)){
			var search_arry = [];
			for(var i=0;i<val.length;i++){
				var re = new RegExp("[\&|\?]" + val[i] + "\=([^\&\?]*)", "ig");
		        search_arry.push((uri.match(re)) ? (uri.match(re)[0].substr(val[i].length + 2)) : null);
			}
		}else{
			console.error('格式错误');
			return false;
		}
		return search_arry;
    },
    
    //url address
	urlAddress		: function(name){
		var URL	= "../../api/"+name+"/index.php";
		return URL;
	},
	
	//ajaxEx封装,不带存储功能complete方法,type='no'表示不需要判断用户登录状态,type不存在表示需要判断用户登录状态,
	ajaxEx			:function(url,data,callback,type){
		if($.inArray('user',url.split("/")) != "-1" && !we_chat.getStorage("user_id")){
			if(type!="no") {
//				popup.prompt('当前操作需要登录,是否继续',[{content:'是',callback:function(){
//						popup.hide();
						//route.go({ module: '#personal/user_login', data: {}, status: 'forward'});
						window.location.href="../../thirdlogin/weixin_log.php";
//					}},{content:'否'}]);
				return false;
			}
		}
		$.ajax({url: url, dataType:"json", async:true, type: "POST", data: data, complete: function(r, s){
				if(s != "success"){
					//有可能微信错误导致报错
					// popup.prompt('网络连接有问题,请检查您的网络设备');
					return false;
				}
				try {
		        	var ret = JSON.parse(r.responseText);
		        	if ((ret['error'] != undefined &&　ret['error'] != "") && ret.status == false){
		        		if(ret.error=="登录超时"){	
		        			we_chat.removeStorage("user_id");
							we_chat.removeStorage("user_info");
						}
						if(ret.error=="登录超时"){
						   window.location.href="../../thirdlogin/weixin_log.php";
						}
	        			popup.prompt(ret.error,[{content:'确定',callback:function(){
							popup.hide();
							
							}}]);
		        		return false;
		        	}
		        	if(typeof callback =="function"){
			            callback(ret);
		        	}
		        } catch (e) {
//					console.info("接受数据出错!"+data.action)
		        }
			}
		})
	},
	
/*
 * 设置cooKie在IOS 下会导致读取失败的问题
 */
	//设置Storage
	setStorage 		: function(name, value){
		if(!name) return false;
		if(typeof value == "object"){
			window.localStorage.setItem(name,JSON.stringify(value));
		}else{
			window.localStorage.setItem(name,value);		
		}
	},
	
	//获取Storage
	getStorage		: function(name){
		if(!name) return false;
		try{
			return JSON.parse(window.localStorage.getItem(name));
		}catch(e){
			return window.localStorage.getItem(name);
		}
	},
	
	//删除Storage
	removeStorage 	: function(name){
		if(name){
			window.localStorage.removeItem(name);
		}else{
			window.localStorage.clear();
		}
	},
	
	//获取选中的数组
	getArry			: function(callabck){
		var list	= $(".index-list").children("li").children("a");
		var checked	= [];
		for(var i=0;i<list.length;i++){
			if(list.eq(i).hasClass("active")){
				checked.push(list.eq(i).data("id"));
			}
		}
		if(!checked.length){
			popup.prompt('请选择要删除的内容!');
			return false;
		}
		if(typeof callabck == "function"){
			callabck(checked);
		}
	},
	
	//从本地选择图片
	choiceImage	: function(that,type){
		if(!type){
			if(!we_chat.getStorage("user_id")){
				//route.go({ module: '#personal/user_login', data: {}, status: 'forward'});
				window.location.href="../../thirdlogin/weixin_log.php";
				return false;
			}
		}
		popup.select([
			// TODO:拍照功能先屏蔽掉 2016-09-19 by xiaoer
//			{content:'拍照',callback:function(){
//				return false;		//待对方提供正式账号后开启此功能
//				if(!we_chat.config){
//					popup.prompt('微信认证未通过');
//					return false;
//				}
//				var images	= {
//					localId	: [],
//					serverId: []
//				}
//				wx.chooseImage({
//				    count: 1, 										// 默认9
//				    sizeType: ['original'], 						// 可以指定是原图还是压缩图，默认二者都有
//				    sourceType: ['camera'], 						// 可以指定来源是相册还是相机，默认二者都有
//				    success: function (res) {
//				    	popup.hide();
//				    	var images	= {
//							localId	: [],
//							serverId: []
//						}
//				        images.localId = res.localIds; 			// 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
//				        if(images.localId.length > 1) {
//			                popup.prompt('请选择一张照片');
//			                return;
//			            }else{
//			            	//上传图片到微信服务器
//			            	wx.uploadImage({
//			                    localId: images.localId[0],
//			                    isShowProgressTips: 1,
//			                    success: function (res) {
//			                        images.serverId.push(res.serverId);
//			                        var sId = images.serverId;
//		                        	/*告诉服务器到微信上下载图片到本地*/
//			                        we_chat.ajaxEx(we_chat.urlAddress("common"),{action:'api_get_weiimage',img_id:sId[0]},function(json){
//			                        	if(type){
//			                        		$("#user_info_img").attr({"src":json.data,"data-url":json.data.split("/img")[1]});
//          								return false;
//			                        	}
//									  	$("<div class='creat_img'><img data-url='"+json.data.split("/img")[1]+"' src='"+json.data+"'/><input type='button' class='message-number' onclick='we_chat.delete_img(this)' value='×'/></div>").prependTo($(".uplaod_img_box"));
//									})
//								},
//			                    fail: function (res) {
//			                        popup.prompt(JSON.stringify(res));
//		                        }
//			                });
//			            }
//				    }
//				});
//			}},
			{content:'从相册中选取',callback:function(){
				$("#user_upload_img").click();
			}},
			{content:'取消'}
		]);
	},
	
	/**
	 * 图片上传功能
	 * @param {Object} that
	 * @param {Object} isOne
	 * 2016.09.23 by xiaoer 新增预览,裁剪功能
	 */
	user_upload_imgs: function(that,isOne){
		if(typeof isOne	== "string"){
			var numbers	=	Number(isOne);
		}
		var num			= numbers || 5;
		var fileObj 		= document.getElementById("user_upload_img").files[0]; 	// 获取文件对象
		if(!/image\/\w+/.test(fileObj.type)){									//判断是否是图片格式
			popup.prompt("请上传正确的图片");
			return false;
		}
		//debugger;
		//we_chat.setStorage('file',fileObj);
		$(".uplaod_img_box").show();
		$(that).remove();
		var filees	= $("<input type='file' style='display:none' accept='image/jpeg,image/jpg,image/png' id='user_upload_img'>");
		if(isOne=='only'){
			filees.attr("onchange","we_chat.user_upload_imgs(this,'only')");
		}else{
			filees.attr("onchange","we_chat.user_upload_imgs(this,'"+num+"')");
		}
		filees.appendTo($(".img_input_remove"));
		if($(".creat_img").length >= num){
    		popup.prompt("图片最多上传"+num+"张");
    		return false;
    	}
		// 添加预览截图图层
//		var html = '<div class="modal_bg"><div class="modal_top"><button type="button" class="clip_img">确定裁剪</button><button type="button" class="close">取消</button></div><div class="modal_body">'+
//				   '<img src="" alt="" style="max-width:none;"/></div></div>';
//		popup.hide();
//		$("body").append( html );
//		var reader = new FileReader();
//		reader.onload = function(evt){
//			var img = new Image();
//			img.src = evt.target.result
//			img.onload = function(){
//				var $img = $(".modal_body img");
//				$img.attr("src",evt.target.result );
//				var w = parseInt(img.width),h = parseInt(img.height);
//				var fontSize = parseFloat($("html").css("fontSize"));
//				if( w == h ){
//					$img.css({
//						'width':'100%',
//						'height':'100%'
//					})
//				}else if( w > h ){
//					var ml = (600/h*w/100 - 6)/2;
//					$img.css({
//						'width':'auto',
//						'height':'100%',
//						'left':'-'+ml+'rem',
//						'top':'0rem'
//					}).data("scale",h/(6*fontSize));
//				}else{
//					var mt = (600/w*h/100 - 6)/2;
//					$img.css({
//						'width':'100%',
//						'height':'auto',
//						'left':'0rem',
//						'top':'-'+mt+'rem'
//					}).data("scale",w/(6*fontSize))
//				}
//			}
//		}
//		reader.readAsDataURL(fileObj);
		
        var FileController 	= we_chat.urlAddress("common");	                  	// 接收上传文件的后台地址 
        var form = new FormData();
        form.append("action","api_upfiles");                        			// 数据
		form.append("upfile_view", fileObj);                           			// 文件对象
        var xhr = new XMLHttpRequest();
        xhr.open("post", FileController, true);
        xhr.onload = function (json) {
            var data =	JSON.parse(json.currentTarget.response);
            popup.hide();
            if(data.status){
            	if(isOne=='only'){
            		$("#user_info_img").attr({"src":'../../static/img'+data.data,"data-url":data.data});
            		return false;
            	}
				$("<div class='creat_img'><img data-url='"+data.data+"' src='../../static/img"+data.data+"'/><input type='button' class='message-number' onclick='we_chat.delete_img(this)' value='×' /></div>").prependTo($(".uplaod_img_box"));
            }else{
            	popup.prompt(data.error);
            }
        };
        xhr.send(form);
	},
	
	//删除图片
	delete_img		: function(that){
		popup.prompt("确定要删除此图片？",[
			{content:'确认',callback:function(){
				if($(".creat_img").find("img").length==1){
			  		$(that).closest(".sec2").hide();
				}
		  		$(that).closest("div").remove();
		  		popup.hide();
			}},{content:'取消'}
		]);
	},
	
	//多页面绑定事件
	deleteBind			: function(){
		//删除按钮
		$(".delete_list").on("click",function(){
			if(!$(".index-list").children("li").length) return false;
			$(this).closest("header").children(".right").hide();
			$(".index-list").children("li").children("a").show();
			$(".index-list").children("li").children("div").addClass("box-checked");
			$(this).closest("header").children("div").show();
		})
		
		//删除全选
		$(".cancel_delete").on("click",function(){
			$(this).closest("header").children(".right").show();
			$(".index-list").children("li").children("a").hide();
			$(".index-list").children("li").children("div").removeClass("box-checked");
			$(this).closest("header").children("div").hide();
		})
		
		//表单切换
		$(".uc-btn-checkbox").on("click",function(){
	  		if($(this).hasClass("active")){
		  		$(this).removeClass("active");
	  		}else{
	  			$(this).addClass("active");
	  		}
	  	})
		
		//表单切换
		$(".write_notes_box").find("span").on("click",function(){
	  		if($(this).hasClass("active")){
		  		return;
	  		}else{
	  			$(this).addClass("active").siblings().removeClass("active");
	  			try{
		  			$(".payment_amount").html(parseInt($(this).text()));
	  			}catch(e){}
	  		}
	  	})
		
		//表单切换
		$(".table-nav-s").find("li").on("click",function(){
			if($(this).hasClass("active")){
		  		return;
	  		}else{
	  			$(this).addClass("active").siblings().removeClass("active");
	  		}
		})
		
		
		//表单切换
		$(".table-nav ,.table-navs").find("li").on("click",function(){
	  		var i = $(this).index();
	  		$(this).closest(".page_conten").find(".tab-ol").children("li").hide();
	  		$(this).addClass("active").siblings().removeClass("active");
	  		$(this).closest(".page_conten").find(".tab-ol").children("li").eq(i).show();
	  	})
		
		//删除确认
		$(".confirm_deletion").on("click",function(){
			var _this			= this; 
  			we_chat.getArry(function(ids){
		  		popup.select([{content:'删除',callback:function(){
		  			var data	= {};
		  			if($(_this).data("provide")=="chenx"){
		  				data.action			= "api_del_resource",
		  				data.resourct_id	= ids
		  			}else{
		  				data.action			= "api_del_notesid",
		  				data.acl_id			= ids
		  			}
					we_chat.ajaxEx(we_chat.urlAddress("user"),data,function(json){
						popup.hide();
						var list	= $(".index-list").children("li").children("a");
						for(var i=0;i<list.length;i++){
							if($.inArray(list.eq(i).data("id"),ids)!=-1){
								list.eq(i).closest("li").remove();
							}
						}
					});
				}},{content:'取消'}]);
  			});
  		})
		
		//添加收藏
		$(".to_my_collection").off("click");
		$(".to_my_collection").on("click",function(){
			var _this			= $(this);
			record_id			= _this.data("id") || we_chat.getUrl("acl_id") || we_chat.getUrl("ask_id");
			collection_type		= _this.data("type") || (we_chat.getUrl("type")=="answer"?"ask":"help");
	  		var data			= {
	  			action			: "api_article_collection",
	  			user_id			: we_chat.getStorage("user_id"),
	  			record_id 		: record_id,
	  			collection_type	: collection_type
	  		}
	  		if(!record_id || !collection_type) return false;
	  		we_chat.ajaxEx(we_chat.urlAddress("user"),data,function(json){
	  			if(json.error=="收藏成功"){
	  				_this.attr("data-status","true");
	  				_this.find("p").html("取消收藏");
	  			}else if(json.error=="取消收藏"){
	  				_this.attr("data-status","");
	  				_this.find("p").html("收藏");
	  			}
		  		popup.prompt(json.error);
		  		$("#prompt-group-button").hide()
		  		setTimeout(function(){
		  			popup.hide();
		  			$("#prompt-group-button").show()
		  		},1000)
		  	})
		})
	},
	
	/**
	* 小型模板替换方法
	* TplID为模板ID的前缀，例如ID=show_home,模板的ID就应该是show_home_tpl,显示容器
	* 如果run为true，则直接返回模板内容，不进行页面替换
	* 如果为add，则视为在模板容器中加载更多
	*/
	miniTemplate	: function(TplID,Item,Run){
		var TPL;
		var SHOW;
		if( typeof TplID == "object" ){
			TPL		 	= TplID.tpl;
			SHOW		= TplID.show;
		}
		var TplInn   = TPL.innerHTML;
		var TplOut	 = '';
		if( SHOW!=null&&Run!="add"&&Run!=true )SHOW.innerHTML = '';
		if(Run=="add" && Item.length<=0 && SHOW.innerHTML != ""){
			return false;
		}
		if( typeof(Item)!="object"||Item.length<=0 ){
			if(SHOW.getAttribute('id')=="info_list_info_show"){
				SHOW.innerHTML = "<section style='text-align: center; padding: 1rem; background: #fff;'>没找到,等你投稿哦</section>";
			}else{
				SHOW.innerHTML = "<section style='text-align: center; padding: 1rem; background: #fff;'>暂无数据</section>";
			}
			return false;
		}
		if(!$.isArray(Item)){
			Item	= [Item];
		}
		if( typeof(Item)=="object"&&Item.length>0 ){
			for(var tplIdx=0;tplIdx<Item.length;tplIdx++){
				var TplHTML 	= TplInn;
				var ItemRs  	= Item[tplIdx];
				var TplHTMLS	= TplHTML;
				for(var ItemName in ItemRs){
					if(typeof ItemRs[ItemName] == "object"){
						for( var ItemsName in ItemRs[ItemName]){
							var RegText = '\\['+ItemsName+'\\]';
							TplHTMLS = TplHTMLS.replace(new RegExp(RegText,'ig'),ItemRs[ItemName][ItemsName]||"");
						}
					}else{
						var RegText = '\\['+ItemName+'\\]';
						TplHTMLS = TplHTMLS.replace(new RegExp(RegText,'ig'),ItemRs[ItemName]||"");
					}
				}
				TplHTMLS	= TplHTMLS.replace(/\[[^\]]+\]/g,'');
				TplOut = TplOut + TplHTMLS;
			}
			if( Run==true ){
				return TplOut;
			}else{
				SHOW.innerHTML 	   = SHOW.innerHTML + TplOut;
				TPL.style.display  = 'none';
//				SHOW.style.display = '';
			}
		}
	},
	
	handleArry 		:function(arry,name,address,cb,types){
		var data 	= [];
		var type	= "common"
		for(var i=0;i<arry.length;i++){
			data.push(arry[i][name]);
		}
		if(data.length==0){
			if(typeof cb == "function"){
				cb(arry);
			}
			return false;
		}
		if(address == "api_user_noread_messages"){
			type	= "user";
		}
		we_chat.ajaxEx(we_chat.urlAddress(type),{action:address,acl_ids:data,type:types},function(json){
			var a = json.data.count;
			for(var i=0;i<arry.length;i++){
				if(arry[i][name]==data[i]){
					arry[i].content = a[data[i]] || "0";
				}
			}
			if(typeof cb == "function"){
				cb(arry);
			}
  		})
	},
	
	//获取本地时间
	getNowFormatDate 	:function() {
	    var date = new Date();
	    var seperator1 = "-";
	    var seperator2 = ":";
	    var month = date.getMonth() + 1;
	    var strDate = date.getDate();
	    if (month >= 1 && month <= 9) {
	        month = "0" + month;
	    }
	    if (strDate >= 0 && strDate <= 9) {
	        strDate = "0" + strDate;
	    }
	    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
	            + " " + date.getHours() + seperator2 + date.getMinutes()
	            + seperator2 + date.getSeconds();
	    return currentdate;
	},
	
	//获取单条收藏与否
	getUsercollection : function(type){
		var user_id				= we_chat.getStorage("user_id"), 
			record_id			= we_chat.getUrl("ask_id")||we_chat.getUrl("acl_id");
		if(!user_id){
			return false;
		}
		we_chat.ajaxEx(we_chat.urlAddress("user"),{action:"api_get_usercollection_status",user_id:user_id,record_id:record_id,collection_type:type},function(json){
			if(json.error=="未收藏"){
				$(".icon-collect").attr("data-status","");
			}else{
				$(".icon-collect").attr("data-status","true");
			}
		})
	}
}

// 上拉加载内容
var loadMore = {
	
	/**
	 * 初始化上拉加载的基本元素
	 * @param {Object} obj:上拉加载的wrapper
	 * @param {Object} page:当前加载数据的page
	 * @param {Object} count:当前数据的所有总数
	 * @param {Object} limit:一次加载多少数据
	 */
	initLoad : function( obj, page, count, limit ){
		var $wrapper = $(obj),
			$loadObj = $wrapper.find(".loading");
			
			$wrapper.data("page",page);
		if( page < Math.ceil(parseInt(count)/limit)){
			
			var loading = "<div class='loading' style='height:.98rem;line-height:.98rem;text-align:center;clear:left;'>↑上拉加载</div>"
			if( !$loadObj.length ){
				$wrapper.append(loading);
			}else{
				$loadObj.empty().text("↑上拉加载");
			}
		}else{
			$wrapper.off("swipeUp");
			$wrapper.find(".loading").empty().text("没有了");
//			setTimeout(function(){
//				$wrapper.find(".loading").fadeOut("slow");
//			},1000);
		}
	},
	
	/**
	 * 上拉事件后的回调
	 * @param {Object} obj:上拉加载的wrapper
	 * @param {Object} fn:ajax回调
	 * @param {Object} limit:一次加载多少数据
	 */
	handler:function( obj, fn,limit){
		var $wrapper = $(obj),
			loading  = "<img src='../image/loading.gif' style='width: 16px;height: 16px;margin-right:5px;vertical-align:middle;'/>加载中...",
		    wrapperH =$wrapper.height(),
		    ulH     = $wrapper.find("ul").height(),
		    ulTop   = $wrapper.scrollTop(),
		    len     = arguments.length;
			arr     = [];
			
			if( len > 3 ){
				for( var i = 3; i < len; i++ ){
					arr.push( arguments[i] );
				}
			}
//		if( wrapperH+ulTop+50 >= ulH ){
				$wrapper.find(".loading").empty().append(loading);
			setTimeout(function(){
				
				if( len == 4){
					fn( arr[0], parseInt($wrapper.data("page")||$wrapper.eq(1).data("page"))+1, limit );
				}else if( len == 5){
					fn( arr[0], arr[1],parseInt($wrapper.data("page")||$wrapper.eq(1).data("page"))+1, limit );
				}else{
					fn( parseInt($wrapper.data("page")||$wrapper.eq(1).data("page"))+1, limit );
				}
				
			},1000);
		//}
	}
}
