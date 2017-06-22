function getUrlParam( name){
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
}

(function(_){
	_.$data = {
		user: we_chat.getStorage('user_info') || {},
		exam: {},
		init: function(){
			this.user = we_chat.getStorage('user_info') || {};
		}
	}
	
	_.$action = {
		isLogin: function(type){
			if( !we_chat.isLogin()){
				//route.go({ module: '#personal/user_login'});
				window.location.href="../../thirdlogin/weixin_log.php";
				return false;
			}
			//用户是否有登陆,如果未登陆则跳入登陆界面,如果登录了而为分班则弹出未分班的提示
//			if(type=="#exam/index" && (!we_chat.getStorage("user_info").class_name || we_chat.getStorage("user_info").class_name == "未分班")){
//				popup.prompt("您还未分班!");
//				return false;
//			}
			return true;
		},
		isPower: function(){
			
			if( !$action.isLogin() ){
				return false;
			}
	
			// 获取当前登录用户的所具有的课程id;如果不登录时，无需请求这个id
			var tree_id = getUrlParam("tree_id");
			var c = $action.api('api_user_getcourse',{ user_id: we_chat.getStorage('user_id')});
			if( c.status){
				var status = false;
				if( !(c.data.length == 0) ){
					for( var k in c.data ){
						if( k == tree_id ){
							status = true;
							break;
						}
					}
				}
				if( !status ){
					popup.prompt( '您当前还没有该课程的权限，请前去活动处报名！',[{content:'前去报名',callback:function(){
								popup.hide();
								route.go({ module: '#activity/list'});
							}},{content:'取消', callback: function(){ popup.hide();}}]);
					return false;
				}
				return true;
			}
		},
		initProblems: function(){
			//console.log("initProblems");
			$action.isLogin();
			
			var topic = we_chat.getStorage("topic");
			if( !(topic) ){
				_.$topic = new Topic();
			}
			
		},
		api: function( action, data){
			var s = false, d = { action: action};
			if( typeof data == 'object'){
				for( k in data){
					if( data[k] !== null || data[k] !== undefined){
						d[k] = data[k];
					}
				}
			}
			$.ajax({
				type: "post",
				url: "../../api/user/index.php",
				data: d,
				dataType: 'json',
				async: false,
				success: function( msg){
					s = msg;
				}
			});
			return s;
		},
		commonApi: function( action, data){
			var s = false, d = { action: action};
			if( typeof data == 'object'){
				for( k in data){
					if( data[k] !== null || data[k] !== undefined){
						d[k] = data[k];
					}
				}
			}
			$.ajax({
				type: "post",
				url: "../../api/common/index.php",
				data: d,
				dataType: 'json',
				async: false,
				success: function( msg){
					s = msg;
				}
			});
			return s;
		},
		apiAsync: function( action, data, fn){
			var s = false, d = { action: action};
			if( typeof data == 'object'){
				for( k in data){
					if( data[k] !== null || data[k] !== undefined){
						d[k] = data[k];
					}
				}
			}
			$.ajax({
				type: "post",
				url: "../../api/user/index.php",
				data: d,
				dataType: 'json',
				async: false,
				success: function( msg){
					s = msg;
				}
			});
			return s;
		},
		getExam: function( tp_id){
			if( $data.exam['tp_id'] != tp_id){
				var data = we_chat.getStorage('exam_data') || {};
				if( data['tp_id'] != tp_id){
					var s = $action.api( 'api_get_paper', { paper_id: tp_id});
					if( !s.status){
						return false;
					}else{
						data = s.data;
						we_chat.setStorage( 'exam_data', s.data);
					}
				}
				$data.exam = data;
			}else{
				var data = $data.exam;
			}
			return data;
		},
		getExamError: function( tr_id, qus_id){
			// todo  8.15 zhangtao 未完成（这里可能是个大坑 (>_<) ）
			var data = we_chat.getStorage('exam_data') || {};
			//	获取错题编号列表
			var s = $action.api( 'api_get_wrong_paper', { tr_id: tr_id});
			if( !s.status){
				return false;
			}
			list = s.data;
			//	获取错误内容
			var s = $action.api( 'api_get_qusids', { quss: list});
			if( !s.status){
				return false;
			}
			console.log( s);
			we_chat.setStorage( 'exam_data', s.data);
			//$data.exam = data;
			$data.exam = s.data
			return s.data[ qus_id - 1];
		},
		getExamData: function( tp_id, qus_id){
			return $action.getExam( tp_id)['ques'][qus_id - 1];
		},
		getExamCount: function( tp_id){
			return $action.getExam( tp_id)['ques']['length'];
		},
		getExamAnswer: function(){
			return $data.exam.answer || [];
		},
		saveExamAnswer: function( qus_id, answer){
			if( isNaN( qus_id)){
				return false;
			}else if( typeof answer != 'string' && !$.isArray( answer) ){
				return false;
			}else if( typeof $data.exam != 'object'){
				return false;
			}
			if( !$.isArray( $data.exam.answer)){
				$data.exam.answer = [];
			}
			if( typeof $data.exam.answer_all_select != 'boolean'){
				$data.exam.answer_all_select = true;
			}
			if( !$.isArray( $data.exam.answer_error)){
				$data.exam.answer_error = [];
			}
			if( !$data.exam.answer_score){
				$data.exam.answer_score = {
					radio: 0,
					checkbox: 0,
					decide: 0
				};
			}
			var type = getUrlParam("type");
			if( !type ){
				var topic = $data.exam.ques[ qus_id - 1],
				id = topic.qus_id,
				status = null;
			}else{
				var topic = $data.exam,
				id = topic.qus_id,
				status = null;
			}
			
			
			if( topic.qus_type == '单选题' ||  topic.qus_type == '多选题' || topic.qus_type == '判断题'){
				var success_list = [];
				for( var i = 0, l = topic.qus_ans.length; i < l; i++){
					if( topic.qus_ans[i].ans_is_correct == '1'){
						success_list.push( topic.qus_ans[i].ans_id);
					}
				}
				if( answer.sort().toString() == success_list.sort().toString()){
					status = true;
					switch ( topic.qus_type){
						case '单选题':
							$data.exam.answer_score.radio += parseInt( topic.qus_number);
							break;
						case '多选题':
							$data.exam.answer_score.checkbox += parseInt( topic.qus_number);
							break;
						case '判断题':
							$data.exam.answer_score.decide += parseInt( topic.qus_number);
							break;
					}
				}else{
					$data.exam.answer_error.push( id);
					status = false;
				}
			}else{
				$data.exam.answer_all_select = false;
			}
			$data.exam.answer.push( { id: id, status: status, answer: answer});
			we_chat.setStorage( 'exam_data', $data.exam);
			return true;
		},
	};
	
	$action.select = [];
	
	
	
	//	题库组件
	var Topic = function(){
		this.init();
	}
	Topic.prototype = {
		init: function(){
//			if( !we_chat.isLogin()){
//				return false;
//			}else{
				_.$data.init();
			//}
			runtime.begin();
			var data = JSON.parse( window.localStorage.getItem('topic'));
			
			if( data){
				this.data = data;
			}else{
				//	获取各种类型题库并保存
				this.data = {
					topic	: {
						tr_radio 		: {},	//	单选题
						tr_checkbox		: {},	//	多选题
						tr_decide 		: {},	//	判断题
						tr_short 		: {},	//	简答题
						tr_discuss		: {},	//	论述题
						tr_calculate	: {},	//	计算题
						tr_case 		: {},	//	案例题
						order           : {},
						random          : {},     //  by xiaoer 随机
						'error-problems': {},
						'undone-problems': {},
						'collect-problems': {}
					},
					answer	: {
						tr_radio 		: this._getAnswer( 'tr_radio'),		//	单选题
						tr_checkbox		: this._getAnswer( 'tr_checkbox'),	//	多选题
						tr_decide 		: this._getAnswer( 'tr_decide'),	//	判断题
						tr_short 		: this._getAnswer( 'tr_short'),		//	简答题
						tr_discuss		: this._getAnswer( 'tr_discuss'),	//	论述题
						tr_calculate	: this._getAnswer( 'tr_calculate'),	//	计算题
						tr_case 		: this._getAnswer( 'tr_case'),		//	案例题
						order			: this._getAnswer( 'order'),      	//	顺序做题
						random          : this._getAnswer("random"),         //  by xiaoer 随机
						'error-problems': this._getAnswer( 'error-problems'),
						'undone-problems': this._getAnswer( 'undone-problems'),
						'collect-problems': this._getAnswer( 'collect-problems')
					},
				
				};
				
				// 存储该类型的题目是否被加载完毕！
				this.dataLoad = {
					tr_radio 		: false,	//	单选题
					tr_checkbox		: false,	//	多选题
					tr_short 		: false,	//	简答题
				}
			}
			runtime.end();
		},
		get: function( type, number){
			switch ( type){
				case 'order':
				case 'tr_radio':
				case 'tr_checkbox':
				case 'tr_decide':
				case 'tr_short':
				case 'tr_discuss':
				case 'tr_calculate':
				case 'tr_case':
				case 'random':
				case 'collect-problems':
					if( parseInt( number) > parseInt( this.data.topic[ type].count)){
						return false;
					}
					return this.data.topic[ type].content[ number - 1];
					break;
				case 'error-problems':
				case 'undone-problems':
					//	by zhangtao 8.15 我的错题和未完成题在每次做题后都会更新，所以每次拿题都会更新
//					var s = this._getTopic( type);
//					if( !s){
//						popup.prompt( '获取题库失败！');
//						return false;
//					}
//					this.data.topic[ type] = s;
//					window.localStorage.setItem('topic', JSON.stringify( this.data));
//					return this.data.topic[ type].content[ number - 1];
//					break;
					
					// by xiaoer 8.31 我的错题和未完成题在做完题的一个个单位次中再进行变更一次
					if( parseInt( number) > parseInt( this.data.topic[ type].count)){
						return false;
					}
					return this.data.topic[ type].content[ number - 1];
					break;
				case 'collect-problems':
					var s = this._getTopic( type);
					if( !s){
						popup.prompt( '获取题库失败！');
						return false;
					}
					this.data.topic[ type] = s;
					window.localStorage.setItem('topic', JSON.stringify( this.data));
					return this.data.topic[ type].content[ number - 1];
					break;
			}
			return false;
		},
		submit: function(){
			
		},
		getAnswer: function( type, number){
			if( !number){
				return this.data.answer[ type];
			}
			if( this.data.answer[ type][ number - 1]){
				return this.data.answer[ type][ number - 1];
			}
			return { status: null};
		},
		saveAnswer: function( type, number, answer){
			var topic = this.get( type, number),
				status = null;
			if( !topic){
				return false;
			}
			if( !$.isArray( this.data.answer[ type])){
				this.data.answer[ type] = [];
			}
			if( $.isArray( topic.qus_ans) && topic.qus_ans.length > 0){
				var success_list = [];
				for( var i = 0, l = topic.qus_ans.length; i < l; i++){
					if( topic.qus_ans[i].ans_is_correct == '1'){
						success_list.push( topic.qus_ans[i].ans_id);
					}
				}
				
				// 简答题answer传入的数据不为数组，为字符串
				if( typeof answer == "string" ){
					if( answer.toString() == success_list.sort().toString()){
						status = true;
					}else{
						status = false;
					}
				}else{
					if( answer.sort().toString() == success_list.sort().toString()){
						status = true;
					}else{
						status = false;
					}
				}
				
			}else{
				// 为简答题，论述题，计算题，案例题：answer: Number(status)
				status = 1;
			}
			this.data.answer[ type][ parseInt( number) - 1] = {
				id		: topic.qus_id,
				status	: status,
				answer	: answer
			};
			var m = null;
			//	提交答案至后台
			switch ( type){
				case 'order':
					m = 1; break;
				case 'random':
					m = 2; break;
				case 'tr_radio':
				case 'tr_checkbox':
				case 'tr_short':
				case 'tr_discuss':
				case 'tr_calculate':
				case 'tr_case':
				case 'tr_decide':
					m = 3; break;
				case 'error-problems':
					m = topic.type;break;
				case 'undone-problems':
					m = 0;break;
			}
			$action.api( 'api_add_qusans', { user_id: we_chat.getStorage('user_id'), answer: Number(status), type: m, qus_id: topic.qus_id, tree_id:getUrlParam("tree_id")});
			window.localStorage.setItem( 'topic', JSON.stringify( this.data));
			
			
			// 将做过的题目存储至另一个key，以表示存储进度
			if( !(type == 'random' || type == 'error-problems' || type == "undone-problems" ) ){
				var progressBar = JSON.parse(window.localStorage.getItem('progress')) || {};
				var progressUser = progressBar[we_chat.getStorage('user_id')] || {};
				var progressTree = progressUser[getUrlParam('tree_id')] || {};
				var  category = progressTree[type] || {};
				var ques = category.ques ||[];
				var ans  = category.ans || [];
				var result = category.result || [];
				var myAnswer = {};
				myAnswer.ans = answer;
				myAnswer.id = topic.qus_id;
				myAnswer.correct = success_list;
				ques[number-1] = topic ;
				ans[number-1] = myAnswer;
				result[number-1] = status ;
				category.ques = ques;
				category.ans = ans;
				category.result = result;
				progressTree[type] = category;
				progressUser[getUrlParam('tree_id')] = progressTree;
				progressBar[we_chat.getStorage('user_id')] = progressUser;
				window.localStorage.setItem( 'progress', JSON.stringify( progressBar ));
			}
			return true;
		},
		getProgress: function( type){
//			var tree_id = $("")
//			var s = $action.api( 'api_get_ordercount', { user_id: $data.user.user_id, tree_id: $data.user.tree_id_user});
//			if( !s.status){
//				console.error( s.error || '获取做题进度信息失败！');
//				return false;
//			}
//			switch ( type){
//				case 'random':
//					return s.data[1]; break;
//				case 'order':
//				case 'tr_radio':
//				case 'tr_checkbox':
//				case 'tr_short':
//				case 'tr_discuss':
//				case 'tr_calculate':
//				case 'tr_case':
//				case 'error-problems':
//				case 'undone-problems':
//				case 'collect-problems':
//				case 'tr_decide':
//					return this.data.answer[ type].length; break;
//				default:
//					console.error('无法获取当前类型的进度信息！');
//					return false; break;
//			}
		},
		getCount: function( type){
			switch ( type){
				case 'order':
				case 'tr_radio':
				case 'tr_checkbox':
				case 'tr_short':
				case 'tr_discuss':
				case 'tr_calculate':
				case 'tr_case':
				case 'tr_decide':
				case 'random':
				case 'error-problems':
				case 'undone-problems':
				case 'collect-problems':
					return parseInt( this.data.topic[ type].count); break;
				default:
					console.error('无法获取当前类型的总题数！');
					return false; break;
			}
		},
		_getOrderTopic: function(){
			var status = true;
			for( var k in this.dataLoad ){
				if( !this.dataLoad[k] ){
					status = false;
					break;
				}
			}
			
			if( status ){
				var a = [];
				this.data.topic.order = {
					content	: a.concat(
						this.data.topic.tr_radio.content,
						this.data.topic.tr_checkbox.content,
						//this.data.topic.tr_decide.content,
						this.data.topic.tr_short.content
//						this.data.topic.tr_discuss.content,
//						this.data.topic.tr_calculate.content,
//						this.data.topic.tr_case.content
					)
				};
				this.data.topic.order.count = this.data.topic.order.content.length;
			}
		},
		_getTopic: function( qus_type, tree_id){
			var that = this;
			switch ( qus_type){
				case 1:
					var s = $action.api( 'api_single_questions', { qus_type: qus_type, tree_id: tree_id, page_start: 1, page_size: 1000});
					if( !s.status){
						console.error( s.error || '获取题库失败！');
						return false;
					}
					that.data.topic.tr_radio = s.data;
				    that.dataLoad.tr_radio = true;
				    that._getOrderTopic();
					break;
				case 2:
					var s = $action.api( 'api_single_questions', { qus_type: qus_type, tree_id: tree_id, page_start: 1, page_size: 1000});
					if( !s.status){
						console.error( s.error || '获取题库失败！');
						return false;
					}
					that.data.topic.tr_checkbox = s.data;
				    that.dataLoad.tr_checkbox = true;
				    that._getOrderTopic();
					break;
				case 3:
				case 4:
					var s = $action.api( 'api_single_questions', { qus_type: qus_type, tree_id: tree_id, page_start: 1, page_size: 1000});
					if( !s.status){
						console.error( s.error || '获取题库失败！');
						return false;
					}
					that.data.topic.tr_short = s.data;
				    that.dataLoad.tr_short = true;
				    that._getOrderTopic();
					break;
				case 5:
				case 6:
				case 7:
				case 'error-problems':
					var s = $action.api( 'api_get_wrong', { user_id: we_chat.getStorage('user_id'), tree_id:getUrlParam("tree_id"),page_start: 1, page_size: 1000});
					if( !s.status){
						console.error( s.error || '获取错题题库失败！');
						return false;
					}
					that.data.topic['error-problems'] = s.data;
					break;
				case 'undone-problems':
					var s = $action.api( 'api_noterecode_noqus', { user_id: we_chat.getStorage('user_id'), tree_id: getUrlParam("tree_id")});
					if( !s.status){
						console.error( s.error || '获取未做题题库失败！');
						return false;
					}
					that.data.topic['undone-problems'] = {
					    	content: s.data,
					    	count: s.data.length
					    };
					break;
				case 'collect-problems':
					var s = $action.api( 'api_get_collection', { user_id: we_chat.getStorage('user_id'), collection_type: 'qus', page_start: 1, page_size: 1000});
					if( !s.status){
						console.error( s.error || '获取收藏题库失败！');
						return false;
					}
					var arr=[];
					for( var i = 0, len = s.data.content.length; i < len; i++ ){
						var res = $action.api( 'api_get_qus_info', { 'qus_id': s.data.content[i]});
						arr.push( res.data );
					}
					that.data.topic['collect-problems'] = {
				    	content: arr,
				    	count: s.data.count
				   };
				   we_chat.setStorage( 'collect',s.data.content );
			}
		},
		_getRandom: function( tree_id){
			var that = this;
			var s = $action.api( 'api_rand_questions', { user_id: we_chat.getStorage('user_id'), rand_num: 30,tree_id:getUrlParam("tree_id")});
			if( !s.status){
//				console.error( s.error || '获取随机题库失败！');
				return false;
			}
			that.data.topic.random = {
		    	content: s.data,
		    	count: s.data.length
		   };
		},
		_getAnswer: function(){
			return [];
		}
	};
	//console.log("_.$topic")
	_.$topic = new Topic();
	
	_.indexLoad	= function(){
		if(we_chat.getStorage("user_id") && we_chat.getStorage("user_info").business_name && we_chat.getStorage("user_info").field_name){
			$(".go-user-info").hide();
		}else{
			//判断是否登录
			$(".go-user-info").on("click",function(){
				if(we_chat.getStorage("user_id")){
					route.go({ module: '#personal/personal_settings', data: {user_id:we_chat.getStorage("user_id")}, status: 'forward'});
				}else{
					window.location.href="../../thirdlogin/weixin_log.php";
					//route.go({ module: '#personal/user_login', data: {}, status: 'forward'});
				}
			});
		}
		
		
		
		var	getInfomatin	= function(){
//		  	var pushdata	= {
//		  		action		: "api_all_article",
//		  		page_start	: "1",
//		  		page_size	: "3"
//		  	}
//		  	we_chat.ajaxEx(we_chat.urlAddress("common"),pushdata,function(json){
//		  		var data 	= json.data.content;
//		  		//模板显示
//				we_chat.miniTemplate({
//		  			tpl	: document.getElementById("info_list_tpl"),
//		  			show: document.getElementById("info_list_show"),
//		  		},json.data.content);		  			
//		  	},"no")
			//获取随机专家-3条
			we_chat.ajaxEx(we_chat.urlAddress("common"),{action:"api_get_exprand",user_id:we_chat.getStorage("user_id")},function(json){
		  		var data 	= json.data.content;
		  		we_chat.miniTemplate({
		  			tpl	: document.getElementById("Community_index_exp_tpl"),
		  			show: document.getElementById("info_list_show"),
		  		},json.data);	
		  	})
	  	}
		getInfomatin();
		
//		Initialize Swiper
		var swiper = new Swiper('.swiper-container', {
		    pagination: '.swiper-pagination',
		    paginationClickable: true,
		    autoplay: 2500,
		    autoplayDisableOnInteraction: false
		});
	};
	
	route.setModule({
		'#': {
			template_url : 'home/index.html',
			onLoad: function(){
				indexLoad();
			}
		},
		'#popup': 'module/popup.html',
		
		'#home/index': {
			template_url : 'home/index.html',
			onLoad: function(){
				indexLoad();
			}
		},
		
		'#FAQs/index': 'FAQs/index.html',
		'#FAQs/interlocution_details': 'FAQs/interlocution_details.html',
		'#FAQs/search': 'FAQs/search.html',
		'#FAQs/question_category': 'FAQs/question_category.html',
		
		'#seek-help/index': 'seek-help/index.html',
		'#seek-help/help_details': 'seek-help/help_details.html',
		'#seek-help/help_category': 'seek-help/help_category.html',
		'#seek-help/state': 'seek-help/state.html',
		
		'#community/index': 'community/index.html',
		'#information/index': 'information/index.html',
		'#information/detail': 'information/detail.html',
		
		'#books/list': {
			template_url: 'books/list.html',
			onLoad: function(){
				var collection = getUrlParam("collection");
				var userInfo   = JSON.parse(window.localStorage.getItem("user_info"));
				var $wrapper = $(".main-content");
				var searchList;
				
				function joinStr( books, page ,limit){
					if( !books.status){
						popup.prompt( s.error || '获取当前分类期刊图书失败！');
						return false;
					}else{
						var bookStr = '',
							bookList = books.data.content;
							
						// 初始化上拉加载的部件及其数据
						loadMore.initLoad( $wrapper, page, books.data.count, limit );
						
						for( var i = 0, len = bookList.length; i<len; i++ ){
							bookStr +=  '<div class="info R-go" path="#books/content" path-data="{book_id:'+bookList[i].book_id+'}"><div class="cover"><img src="'+bookList[i].book_cover+'" alt="封面"/>'+
										'</div><div class="title">'+bookList[i].book_name+'</div></div>'
						}
						if( page == 1){
							$(".info-list").empty().append( bookStr );
						}else{
							$(".info-list").append( bookStr );
						}
					}
				}
				
				// collection==true获得被收藏的学术报刊，否则显示全部内容的学术报刊
				if( collection !== "true" ){
					var s = $action.commonApi( 'api_book_category');
					if( !s.status){
						popup.prompt( s.error || '获取书刊分类失败！');
						return false;
					}else{
						var str = '', currId = '',
							list = s.data[0];
						for( var i = 0, len = list.length; i < len; i++ ){
							if( i === 0 ){
								currId = list[i].tree_id
								str += '<div class="label" data-curr data-id="'+list[i].tree_id+'">'+list[i].tree_name+'</div>';
							}else{
								str += '<div class="label" data-id="'+list[i].tree_id+'">'+list[i].tree_name+'</div>';
							}
						}
						$(".label-list").append( str );
						
						// 请求书籍内容
						var loadList = function( id, page, limit){
							var books = $action.commonApi( 'api_get_book',{
								tree_id:id,
								page_start: page,
								page_size:limit
							});
							joinStr( books, page, limit );
						}
						loadList( currId, 1, 12);
						
						// 为分类栏目绑定事件
						$(".label-list .label").on("tap",function(){
							var $this = $(this),
								bookId = $this.data("id");
								
								$("input[name=search]").val('');
								$this.attr('data-curr',true).siblings().removeAttr("data-curr");
								loadList( bookId, 1, 12);
						})
						
						var searchList = function( id, txt, page, limit){
							var books = $action.commonApi( 'api_book_search',{
								keyword:txt,
								tree_id: id,
								page_start: page,
								page_size:limit
							});
							//joinStr( books, page, limit );
							// todo byxiaoer 等强哥接口调好这部分代码可以删除掉
							if( !books.status){
								popup.prompt( s.error || '获取当前分类期刊图书失败！');
								return false;
							}else{
								var bookStr = '',
									bookList = books.data.content;
									
								// 初始化上拉加载的部件及其数据
								//loadMore.initLoad( $wrapper, page, books.data.count, limit );
								
								for( var i = 0, len = bookList.length; i<len; i++ ){
									bookStr +=  '<div class="info R-go" path="#books/content" path-data="{book_id:'+bookList[i].book_id+'}"><div class="cover"><img src="'+bookList[i].book_cover+'" alt="封面"/>'+
												'</div><div class="title">'+bookList[i].book_name+'</div></div>'
								}
								if( page == 1){
									$(".info-list").empty().append( bookStr );
								}else{
									$(".info-list").append( bookStr );
								}
							}
						}
						
						// 这里是仅仅使用回车键再进行搜索？
//						$("input[name='search']").change(function(){
//							var txt  = $(this).val();
//							var reg = /^\s*$/;
//							if( !txt || (txt&&reg.test(txt))){
//								popup.prompt("请输入合法的关键字");
//								return false;
//							}
//							searchList( txt, 1, 12);
//						});
						
						$("input[name='search']").keydown(function(e){
							if( e.keyCode == 13){
								var txt  = $(this).val();
								var id  = $(".label[data-curr]").attr("data-id");
								var reg = /^\s*$/;
								if( !txt || (txt&&reg.test(txt))){
									popup.prompt("请输入合法的关键字");
									return false;
								}
								searchList( id, txt, 1, 12);
							}
						});
//						$("input[name='search']").focus(function(){
//							var txt  = $(this).val();
//							var reg = /^\s*$/;
//							if( !txt || (txt&&reg.test(txt))){
//								popup.prompt("请输入合法的关键字");
//								return false;
//							}
//							searchList( txt, 1, 12);
//						});
						
						
					}
				}else{
					$(".label-list").hide();
					$(".search").hide();
					var loadList = function( user_id, type, page, limit){
						var data = $action.api('api_get_collection',{user_id:user_id,collection_type:type,page_start:page,page_size:limit});
						if( data.status){
							var list = data.data.content,
								l = list.length,
								html = '';
							for( var i = 0; i < l; i++){
								var title = list[i].content.book_name || '',
									exp = list[i].content.exp || '',
									img = list[i].content.book_cover,
									acl_id = list[i].content.book_id;
								html += [
									'<div class="info R-go" path="#books/content" path-data="{book_id:'+acl_id+'}">',
									'   <div class="cover"><img src="'+img+'" alt="'+title+'"/></div>',
									'	<div class="title">'+title+'</div>',
									'</div>'
								].join('');
							}
							$('.info-list').empty().append( html);
							return true;
						}
						return false;
					}
					loadList(userInfo.user_id,'book',1,12);
				}
				
				$wrapper.on("swipeUp",function(){
					if( $('input[name="search"]').val() !== '' ){
						var keyWord = $('input[name="search"]').val();
						loadMore.handler( $wrapper, searchList,12,keyWord);
					}else{
						var id = $(".label[data-curr]").attr("data-id");
						loadMore.handler( $wrapper, loadList,12, id )
					}
				})
				
			}
		},
		'#books/content': {
			template_url: 'books/content.html',
			onBefore: function(){
				
			},
			onLoad: function(){
				var bookId = getUrlParam('book_id'),
					s = $action.commonApi('api_book_detail', { book_id: bookId}),
					buyUrl = [];
					user_id = s.data.user_id;
				if( !s.status){
					popup.prompt( s.error);
				}else{
					$('.book .photo img').attr("src", s.data.book_cover);
					$('.book .info .title').text( s.data.book_name );
					$('.book .info .author').text( "作者："+s.data.book_author_name );
					$('.book .info .press').text( "出版社："+s.data.book_press_name );
					$('.book .info .pubtime').text( "出版时间："+(s.data.book_publish_time).substr(0,10));
					$('.book .info .pages').text( "页数："+s.data.book_publish_chapter );
					$('.book-intro .content').text( s.data.book_exp );
					buyUrl = s.data.book_buy;
					
					// 图书推荐部分代码
					var random = $action.commonApi('api_rand_book',{tree_id:s.data.tree_id});
					if( !random.status){
						popup.prompt( random.error);
					}else{
						var imgList = random.data,
							str = '';
						for( var i = 0, len = imgList.length; i < len; i++ ){
							str += '<div class="book-box R-go" path="#books/content" path-data="{book_id:'+imgList[i].book_id+'}"><div class="photo"><img src="'+imgList[i].book_cover+'" alt="图片"/>'+
								   '</div><div class="name">'+imgList[i].book_name+'</div></div>'	
						}
						$(".book-recommend .content").append(str);
					}
				}
				
				// 添加收藏
				$(".collect").on("tap",function(){
					var random = $action.api('api_article_collection',{
						'user_id': window.localStorage.getItem("user_id"),
						'record_id': bookId,
						'collection_type':'book'
					});
					if( !random.status){
						popup.prompt( random.error);
					}else{
						popup.prompt( random.error);
						if( $(".collect").hasClass('ed') ){
							$(".collect").removeClass('ed');
						}else{
							$(".collect").addClass('ed');
						}
					}
					$("#prompt-group-button").hide()
					setTimeout(function(){
						popup.hide();
						$("#prompt-group-button").show()
					},1000);
				})
				
				var status = $action.api('api_get_usercollection_status',{
						'user_id': window.localStorage.getItem("user_id"),
						'record_id': bookId,
						'collection_type':'book'
					});
					
				if( status.status){
					if( status.error == '已收藏' ){
						$(".collect").addClass('ed');
					}
				}
				
				// 查看购买地址弹框
				$(".book .buy").on("click",function(){
					console.log( buyUrl.length );
					if( !!buyUrl.length ){
						var buyArr = [];
						for( var i = 0, len = buyUrl.length; i <len; i++ ){
							var buy = {},
								webUrl = buyUrl[i].web_url;
							buy.content = "去"+buyUrl[i].web_name+"购买&nbsp;&nbsp;&yen;"+buyUrl[i].book_money;
							buy.callback = function(){
								window.location.href = webUrl;
							}
							buyArr.push(buy)
						}
						buyArr.push({content:'关闭'});
						popup.select(buyArr)
					}else{
						popup.prompt( "当前书籍无购买地址");
					}
				})
				
			}
		},
		'#exam/index': {
			template_url: 'exam/index.html',
			onBefore: function(){
				//window.localStorage.removeItem("topic");
//				$action.initProblems();
			},
			onLoad: function(){
				var $m = {}, $f = {};
				$f.q = function( action, data){
					var s = false,
						data = data || {};
					data.action = action;
					
					$.ajax({
						type: "post",
						url: "../../api/user/index.php",
						data: data,
						dataType: 'json',
						async: false,
						success: function( msg){
							
							s = msg.status? msg.data: msg.status;
							if( msg.error == '登录超时' ){
								window.location.href="../../thirdlogin/weixin_log.php";
							}
						}
					});
					return s;
				}
				
				// 获取练习题分类信息
				var course = $action.commonApi('api_get_allcourse');
				if( course.status){
					var list = course.data,
						str = '';
					for( var i = 0, len = list.length; i < len; i++ ){
						str += '<li data-id="'+list[i].tree_id+'">'+list[i].tree_by_name+'</li>'
					}
					$(".courList").empty().append(str);
				}
				
				$m.user_id = we_chat.getStorage('user_id');
				$m.user_info = we_chat.getStorage('user_info');
				
				// 因为要将tree_id加入到题目搜索中所以需要对请求题目的操作传入tree_id;
				$m.tree_id  = getUrlParam("tree_id") ? getUrlParam("tree_id") : window.sessionStorage.getItem('tree_id');
				if( !(!$m.tree_id  && typeof $m.tree_id != "undefined" && $m.tree_id != 0)){
					var tree_name = $(".courList li[data-id='"+$m.tree_id+"']").text();
					$(".header .title").data("id",$m.tree_id).prepend( tree_name );
					courseCount( $m.tree_id );
				}else{
					var firstLi = $(".courList li").first();
					$(".header .title").data("id",firstLi.data("id")).prepend( firstLi.text() );
					courseCount( firstLi.data("id") );
				}
				
				// 获取随机的专家
				var s = $action.commonApi('api_get_randexp', { tree_id: getUrlParam("tree_id"), num: 2,user_id:$m.user_id});
				if( s.status){
					var list = s.data,
						str = '';
					for( var i = 0, len = list.length; i < len; i++ ){
						str += '<section class="layout-child-row R-go" path="#personal/expert_homepage" path-data="{user_id:'+list[i].user_id+'}"><section class="layout-1-1 expert"><div class="photo" style="background-image:url('+list[i].user_photo+')"></div>'+
							   '<div class="info"><div class="row"><div class="name">'+list[i].user_name+'</div><div class="job">'+list[i].user_professional+'</div></div><div class="row"><div class="expert-org">'+list[i].exp_org+'</div>'+
							   '</div><div class="row"><div class="expert-infos">'+list[i].exp_org+'</div></div></div></section></section>'
					}
					$(".teacher").append(str);
				}
				
				// 当tap title时课程列表显示
				$(".title").on("tap",function(){
					var $this = $(this);
					if( $this.hasClass("show") ){
						$(".courList").css("height",'0');
						$this.closest("header").css("z-index",1);
						$this.removeClass("show")
					}else{
						$(".courList").css("height",'auto');
						$this.closest("header").css("z-index",6);
						$this.addClass("show")
					}
				})
				
				// 当tap title时课程列表显示
				$(".courList li").on("tap",function(){
					var $this = $(this);
					$(".title").data("id", $this.data("id")).text( $this.text() );
					
					courseCount( $this.data("id") );
					$(".courList").css("height",'0');
					$(".header").css("z-index",1);
					$(".title").removeClass("show");
					
					// 删除顺序练习中的内容
					if(('count' in $topic.data.topic.order) ){
						delete $topic.data.topic.order.count;
						delete $topic.data.topic.order.content;
					}
					for( var t in $topic.data.answer ){
						$topic.data.answer[t] = [];
					}
					$action.select = [];
					
					window.sessionStorage.setItem('tree_id', $this.data("id") );
				})
				
				// 将整体的加载题目的方式修改为单个加载一类题目
				// 2016.09.28 xiaoer 将tap事件改为click
				$(".R-go").on("touchstart",function(){
					var urlType = JSON.parse($(this).attr("path-data")).type;
					var spec    = $(this).attr("path");
					var tree_id = getUrlParam("tree_id");
					
//					var c = $action.api('api_user_getcourse',{ user_id: we_chat.getStorage('user_id')});
//					if( c.status){
//						var status = false;
//						if( !(c.data.length == 0) ){
//							for( var k in c.data ){
//								if( k == tree_id ){
//									status = true;
//									var modal_bg = "<div class='modal_bg' style='width:100%;height:100%;background:rgba(0,0,0,.4);position:absolute;top:0;left:0;z-index:99;display:table'><p style='color:#fff;text-align:center;display:table-cell;vertical-align:middle'>正在加载中...</p></div>"
//									$("body").append( modal_bg );
										
//									setTimeout(function(){
										if( urlType == 'order' || spec == '#exam/special_practice' ){
											if(!('count' in $topic.data.topic.order) ){
												$topic._getTopic( 1, tree_id);	//	单选题
												$topic._getTopic( 2, tree_id);	//	多选题
												$topic._getTopic( 4, tree_id);	//	简答题
											}	
										}else if( urlType == 'random' ){
											$topic._getRandom(tree_id);
											$topic.data.answer.random = [];
										}else if( urlType == 'error-problems' ){
											$topic._getTopic( 'error-problems')
											$topic.data.answer['error-problems'] = [];
										}else if( urlType == 'undone-problems'){
											$topic._getTopic( 'undone-problems');
											$topic.data.answer['undone-problems'] = [];
										}else if( urlType == 'collect-problems'){
											$topic._getTopic( 'collect-problems');
											$topic.data.answer['collect-problems'] = [];
										}
										if( $(".modal_bg").length ){
											$(".modal_bg").remove()
										}
//									},10)
//								}
//							}
//						}
//					}
					
					
				})
				
				// 请求题目数量
				function courseCount( tree_id ){
					$m.topic_totle = $f.q('api_question_count', { tree_id: tree_id}) || 0;
					$m.courseware_totle = $f.q('api_courseware', { tree_id: tree_id }) || 0;
					
					if( typeof $m.courseware_totle !== 'number'){
						$m.courseware_totle = $m.courseware_totle.count
					}
					if( $m.user_id ){
						$m.topic_order_complete = $f.q('api_recode_count_questions', { user_id: $m.user_info.user_id, tree_id: tree_id, type: 1}) || 0;
//						$m.topic_random_complete = $f.q('api_recode_count_questions', { user_id: $m.user_info.user_id, tree_id: tree_id,type: 2}) || 0;
						$m.topic_item_complete = $f.q('api_recode_count_questions', { user_id: $m.user_info.user_id, tree_id: tree_id,type: 3}) || 0;
						$m.courseware_read = $f.q('api_user_courseware_read', { user_id: $m.user_info.user_id, tree_id: tree_id}) || 0;
						$m.error_totle = $f.q('api_get_wrong_topic_no', { user_id: $m.user_info.user_id, tree_id: tree_id,whether: 0}) || 0;
						$m.unused_totle = $f.q('api_notrecode_questions',{ user_id: $m.user_info.user_id, tree_id: tree_id}) || 0;
						$m.collect_totle = $f.q('api_get_collection_count', { user_id: $m.user_info.user_id,collection_type: 'qus'}) || 0;
						$m.guide_totle = $f.q('api_get_guide', { acl_tree: tree_id}) || 0;
					}else{
						$m.topic_order_complete = 0;
						$m.topic_random_complete = 0;
						$m.topic_item_complete = 0;
						$m.courseware_read = 0;
						$m.error_totle = 0;
						$m.unused_totle = 0;
						$m.collect_totle = 0;
						$m.guide_totle = 0;
					}
					
					if( $m.collect_totle == 0 ){
						$('#collect_totle').closest('section').removeClass('R-go');
					}
					
					if( $m.error_totle == 0 ){
						$('#error_totle').closest('section').removeClass('R-go');
					}
					
					$('#topic_order_complete').text( $m.topic_order_complete+'/'+$m.topic_totle);
					$('#topic_item_complete').text( $m.topic_item_complete+'/'+$m.topic_totle);
					$('#courseware').text( $m.courseware_read+'/'+$m.courseware_totle);
					$('#error_totle').text( $m.error_totle+'题');
					$('#unused_totle').text( $m.unused_totle+'题');
					$('#collect_totle').text( $m.collect_totle+'题');
					$('#guide_totle').text( $m.guide_totle+'个');
					
					// 将当前url的地址进行改变
					var currUrl = (window.location.href).replace(/\?tree_id=\d+/g,'');
					window.history.replaceState({},'',currUrl+"?tree_id="+tree_id);
					var go = $(".R-go");
					for( var i = 0, len = go.length; i < len; i++ ){
						var path = go.eq(i).attr("path-data");
						if( path ){
							jsonPath = JSON.parse(path);
						}else{
							jsonPath = {};
						}
						jsonPath.tree_id = tree_id;
						go.eq(i).attr("path-data", JSON.stringify(jsonPath) );
					}
				}
			}
		},
		'#exam/special_practice': {
			template_url: 'exam/special_practice.html',
			onBefore: $action.isLogin,
			onLoad: function(){
				var go = $(".R-go");
				var tree_id = getUrlParam("tree_id");
				if( tree_id ){
					for( var i = 0, len = go.length; i < len; i++ ){
						var path = go.eq(i).attr("path-data");
						if( path ){
							jsonPath = JSON.parse(path);
						}else{
							jsonPath = {};
						}
						jsonPath.tree_id = tree_id;
						go.eq(i).attr("path-data", JSON.stringify(jsonPath) );
					}
				}else{
					throw new Error ("#exam/special_practice: url上没有相应的tree_id");
				}
			}
		},
		'#exam/courseware': {
			template_url: 'exam/courseware_list.html',
			onBefore: $action.isPower,
			onLoad: function(){
				var tree_id = getUrlParam('tree_id'),
					$wrapper = $(".main-content");
				var loadList = function( id, page, limit){
					var s = $action.api('api_courseware', { tree_id: id, page_start: page, page_size: limit});
					if( s.status){
						var list = s.data.content,
							l = list.length,
							html = '';
						
						// 初始化上拉加载的部件及其数据
						loadMore.initLoad( $wrapper, page, s.data.count, limit );
						
						for( var i = 0; i < l; i++){
							var id = list[i].cour_id,
								title = list[i].cour_title,
								date = list[i].cour_crt_time,
								id_str = "{'id':'"+id+"','tree_id':'"+getUrlParam('tree_id')+"'}";
							html += [
								'<li class="R-go" path="#exam/courseware_info" path-data="'+id_str+'">',
								'	<span class="courseware-name">'+title+'</span>',
								'	<span class="courseware-date">'+date+'</span>',
								'</li>'
							].join('');
						}
						if( page == 1){
							$('.layout-container ul').empty().append( html);
						}else{
							$('.layout-container ul').append( html);
						}
						return true;
					}
					return false;
				}
				loadList( tree_id, 1, 20);
				
				$wrapper.on("swipeUp",function(){
					loadMore.handler( $wrapper, loadList, 20, tree_id);
				})
			}
		},
		'#exam/courseware_info': {
			template_url: 'exam/courseware_info.html',
			onBefore: $action.isLogin,
			onLoad: function(){
				var id = getUrlParam( 'id');
				if( !id){
					popup.prompt( '参数异常！', [{content:'返回上一页', callback: function(){ route.back();}}]);
				}
				var s = $action.api( 'api_courseware_detail', { cal_id: id,user_id:window.localStorage.getItem("user_id"),tree_id:getUrlParam('tree_id')});
				if( !s.status){
					popup.prompt( s.error || '获取课件内容失败！', [{content:'返回上一页', callback: function(){ route.back();}}]);
				}
//				var con = (s.data.cour_text).replace(/<{1}[/]?[^>]*[/]?>{1}/g,'');
				$('.courseware-name').text( s.data.cour_title || '');
				$('.courseware-date').text( s.data.cour_crt_time || '');
				$('.courseware-content').html( s.data.cour_text || '');
				$('.courseware-name').text( s.data.cour_title || '');
				if( !s.data.cour_file){
					$('.accessory').hide();
					console.log( '没有可下载文件！');
				}else{
					var urlKj = s.data.cour_file
					$(".download").on("tap",function(){
						window.location.href = urlKj;
					})
				}
			}
		},
		'#exam/list': {
			template_url: 'exam/list.html',
			onBefore: $action.isPower,
			onLoad: function(){
				var userInfo = JSON.parse(window.localStorage.getItem("user_info")),
					$wrapper = $(".main-content");
					
				$(".back").attr("path-data","{tree_id:'"+getUrlParam("tree_id")+"'}");
				var loadList = function( page, limit){
					var res = $action.api( 'api_get_testpaper', {tree_id:getUrlParam("tree_id"),page_start: page, page_size: limit});
					if( res.status == false){
						popup.alert( res.error);
					}else{
						var list = res.data.content,
							html = '',
							l = list.length;
						
						// 初始化上拉加载的部件及其数据
						loadMore.initLoad( $wrapper, page, res.data.count, limit );
						
						for( var i = 0; i < l; i++){
							var id = list[i].tp_id;
							html += [
								'<li class="R-go" data-id="'+id+'" path="#exam/do_problems" path-data=\'{"pattern":"exam","paper_id":"'+id+'","sub":"list","tree_id":"'+getUrlParam('tree_id')+'"}\'>',
								'	<span class="title">'+list[i].tp_name+'</span>',
								'	<span class="remark">已有 '+list[i].paper_num+' 人考试</span>',
								'</li>'
							].join('');
						}
						if( page == 1){
							$('.main-content ul').empty().append( html);
						}else{
							$('.main-content ul').append( html);
						}
					}
				}
				loadList( 1, 20);
				
				// 查看用户考试过哪些题单
				var c = $action.api( 'api_get_user_record', { user_id: we_chat.getStorage('user_id'), page_start: 1, page_size: 100,tree_id:getUrlParam('tree_id')});
				if( !c.status){
					popup.prompt( s.error);
					return false;
				}
				var oLi = $("li.R-go");
				for( var i = 0, leng = c.data.content.length; i < leng; i++ ){
					for( var j = 0, length = oLi.length; j < length; j++ ){
						if( oLi.eq(j).data("id") == c.data.content[i].tp_id ){
							oLi.eq(j).removeClass("R-go").addClass("no-go");
						}
					}
				}
				
				$wrapper.on("swipeUp",function(){
					loadMore.handler( $wrapper, loadList,20);
				})
				
				// 为不能跳转的题单设置提示框
				$(".no-go").on("tap",function(){
					popup.prompt("当前考卷已经考试过，不允许重复考试，请前去考试记录中点击再做一次！");
				})
			}
		},
		'#exam/do_problems': {
			template_url: 'exam/do_problems.html',
			onBefore: $action.isPower,
			onLoad: function(){
				
				// 如果有需要跳转到子页面则跳转到子页面
				var sub = getUrlParam("sub");
				if( sub ){
					$(".back").attr("path","#exam/"+sub);
				}
				
				// 跳转到具体的某一类课程的练习题页面
				$(".back").attr("path-data","{tree_id:'"+getUrlParam("tree_id")+"'}");
				
				// 定义一个变量，表示这道题是否做过,用已表示做题的状态,false表示未做,true表示已做
				var qusStatus = false;
				
				var pattern = getUrlParam('pattern');
				if( pattern == 'exam'){
					var paper_id = getUrlParam('paper_id'),
						record_id = getUrlParam("record_id"),
						qus_id = getUrlParam('qus_id') || 1,
						problems_count = $action.getExamCount( paper_id),
						type = getUrlParam( 'type') || 'normal',
						data;
					switch( type){
						case 'normal':
						case 'look':
							data = $action.getExamData( paper_id, qus_id);
							break;
						case 'error':
							data = $action.getExamError( record_id, qus_id);
							break;
					}
					
					if( !data){
						popup.prompt("当前没有可做的题！",[{ content:'返回上一页', callback: function(){ popup.hide(); route.back();}}]);
					}
					
					//	确认当前考题状态,如果答案中没有显示则表示这道题没有做过
					var answer = $action.getExamAnswer();
					if( typeof answer[ qus_id - 1] == 'undefined'  ){
						$('.submit').attr( 'data-status', 'true');
						qusStatus = false;
					}else{
						$('.submit').attr( 'data-status', 'false');
						qusStatus = true;
						// 如果type有值，则表示是查看错题，或者查看考卷
						if( !getUrlParam('type') ){
							nextBind(qus_id, problems_count, 'exam');
						}
					}
					
					// 如果user为考试时，则不显示答案
					if( type != "normal" ){
						//	显示考试题答案，仅用于查看考题或者查看错题
						$('.main-content').attr('data-answer', 'true');
						showAnwser( data, answer.status );
						$('.submit').attr( 'data-status',"true").text('下一题');
						
						// 为选择题初始答案
						qusStatus = true;
						if( type == 'random' || type == 'error-problems' || type == 'undone-problems'){
							var arr = [];
							for( var i = 0, len = data.qus_ans.length; i < len; i++){
								if( data.qus_ans[i].ans_is_correct === '1'){
									arr.push(data.qus_ans[i].ans_id);
								}
							}
							var qusAns = {
								id: answer.id,
								ans:answer.answer,
								correct:arr
							}
							$action.select.push( qusAns );
						}
						
						//	载入换题列表
						var html = '',
							list = ($action.status).split(",") || [],
							l = list.length,
							success_count = 0,
							error_count = 0;
							
						if( type == "error" ){
							var count = $data.exam.length;
							for( var j = 0; j < l; j++ ){
								
								if( list[j] != "0" ){
									list.splice(j,1);
									j--;
									l = list.length;
								}
							}
						}else{
							var count = problems_count;
						}
						for( var i = 1; i <= count; i++){
							var status = 'null';
								if( list[ i - 1] == 1){
									status = 'success';
									success_count++;
								}else if( list[ i - 1] == 0){
									status = 'error';
									error_count++;
								}
							if( i == qus_id){
								status = 'current';
							}
							html += '<button class="problems-topic" data-status="'+status+'">'+i+'</button>';
						}
						$('.problems-list-info').empty().append( html);
						$('.success-count').text( success_count);
						$('.error-count').text( error_count);
					
						// 显示错题的数量
						if( type == "error" ){
							$('.problems-count').text( '1-'+ $data.exam.length);
						}else{
							$('.problems-count').text( '1-'+ problems_count);
						}
					}else{
						var html = '',
							list = $data.exam.answer || [],
							l = list.length,
							success_count = 0,
							error_count = 0;
							
						if( type == "error" ){
							var count = $data.exam.length;
						}else{
							var count = problems_count;
						}
						for( var i = 1; i <= count; i++){
							var status = 'null';
							if( i <= l && list[ i - 1] != null && typeof list[ i - 1].status == 'boolean'){
								if( list[ i - 1].status == true){
									status = 'success';
									success_count++;
								}else if( list[ i - 1].status == false){
									status = 'error';
									error_count++;
								}
							}
							if( i == qus_id){
								status = 'current';
							}
							html += '<button class="problems-topic" data-status="'+status+'">'+i+'</button>';
						}
						$('.problems-list-info').empty().append( html);
						$('.success-count').text( success_count);
						$('.error-count').text( error_count);
					
						// 显示错题的数量
						if( type == "error" ){
							$('.problems-count').text( '1-'+ $data.exam.length);
						}else{
							$('.problems-count').text( '1-'+ problems_count);
						}
					}
					//qusCount();
				
					
					//	载入换题列表
					function qusCount(){
						var html = '',
							list = $data.exam.answer || [],
							l = list.length,
							success_count = 0,
							error_count = 0;
							
						if( type == "error" ){
							var count = $data.exam.length;
						}else{
							var count = problems_count;
						}
						for( var i = 1; i <= count; i++){
							var status = 'null';
							if( i <= l && list[ i - 1] != null && typeof list[ i - 1].status == 'boolean'){
								if( list[ i - 1].status == true){
									status = 'success';
									success_count++;
								}else if( list[ i - 1].status == false){
									status = 'error';
									error_count++;
								}
							}
							if( i == qus_id){
								status = 'current';
							}
							html += '<button class="problems-topic" data-status="'+status+'">'+i+'</button>';
						}
						$('.problems-list-info').empty().append( html);
						$('.success-count').text( success_count);
						$('.error-count').text( error_count);
					
						// 显示错题的数量
						if( type == "error" ){
							$('.problems-count').text( '1-'+ $data.exam.length);
						}else{
							$('.problems-count').text( '1-'+ problems_count);
						}
					}
				}else if( pattern == 'practice'){
					
					var type = getUrlParam('type'),
						problems_count = $topic.getCount( type);	//	总题数 
					
					// 解决对某具体题进行刷新操作时导致的显示错误
					if( !('count' in $topic.data.topic[type]) ){
						popup.prompt( '不允许对该项内容进行刷新操作！', [{
							content: '返回首页',
							callback: function(){
								popup.hide();
								route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
							}
						}]);
						return false;
					}
					
					// 2016.08.27 by xiaoer 将做题进度放入程序中...
					var progress = JSON.parse( window.localStorage.getItem("progress") ) || {},
						userQus  = progress[we_chat.getStorage('user_id')] || {},
						treeQus  = userQus[getUrlParam('tree_id')] || {},
					    typeQus = treeQus[type],
					    length = typeQus && typeQus.ques && typeQus.ques.length ? typeQus.ques.length+1 : 1;
					
					if( !(type == 'random' || type == 'error-problems' || type == "undone-problems" ) ){
					    if( length > problems_count ){
					    	treeQus[type] = {};
					    	userQus[getUrlParam('tree_id')] = treeQus;
					    	progress[we_chat.getStorage('user_id')] = userQus;
					    	window.localStorage.setItem('progress' ,JSON.stringify(progress) );
					    	length = 1;
							typeQus = {};
							
							// 清除保存在内存中的做题状态
							$topic.data.answer[type] = [];
					    }
				   }
					
					// 第一次进入页面修改url的值跳转到进度的题
					var url = getUrlParam('qus_id') ?window.location.href : window.location.href+"&qus_id="+length;
					window.history.replaceState(null, '',url);
					
					// 获取修改后的qus_id
					var qus_id = getUrlParam('qus_id') || 1;
					
					/**
					 * 错题，未做题，随机题，不做进度
					 * 当有进度时，使用放置于localStorage中的进度
					 */
					if( (type != "error-problems" && type != "undone-problems"&& type != "random") && typeQus && typeQus.ques && typeQus.ques.length >= qus_id && typeQus.ques[qus_id-1] ){
						var data   = typeQus.ques[qus_id-1];
						$('.main-content').attr('data-answer', 'true');
						nextBind( qus_id, problems_count );
						showAnwser( data, !!(typeQus.result[qus_id-1]));
						
						//	载入换题列表
						var list = typeQus.result || [];
						qusStatus = true;
						$action.select = typeQus.ans;
					}else{
						//	题目类型,未做题部分代码
						var	data = $topic.get( type, qus_id),			//	当前题目
							problems_curr = $topic.getProgress( type),	//	已完成题数
							answer = $topic.getAnswer( type, qus_id);	//	当前题目答案
						
						if( problems_count == 0 ){
							popup.prompt("当前类型没有可做的问题！",[{ content:'返回上一页', callback: function(){ popup.hide(); route.back();}}]);
							return false;
						}
						
						if( !problems_count){
							popup.prompt( '当前类型没有可做的问题！', [{ content:'返回上一页', callback: function(){ popup.hide(); route.back();}}]);
							return false;
						}
						
						if( !data){
							popup.prompt( '获取题目失败！');
						}
						
						//	初始化本题按钮
						if( typeof answer.status != 'boolean'){
							//	本题未答
							$('.main-content').attr('data-answer', 'false');
							$('.submit').attr( 'data-status', true);
						}else{
							//	本题已答
							$('.main-content').attr('data-answer', 'true');
							nextBind( qus_id, problems_count );
							showAnwser(data,answer.status);
							
							// 为选择题初始答案
							qusStatus = true;
							if( type == 'random' || type == 'error-problems' || type == 'undone-problems'){
								var arr = [];
								for( var i = 0, len = data.qus_ans.length; i < len; i++){
									if( data.qus_ans[i].ans_is_correct === '1'){
										arr.push(data.qus_ans[i].ans_id);
									}
								}
								var qusAns = {
									id: answer.id,
									ans:answer.answer,
									correct:arr
								}
								$action.select.push( qusAns );
							}
						}
						var list = $topic.getAnswer( type) || [];
					}
				
					//	载入换题列表
					var html = '',
						l = list.length,
						success_count = 0,
						error_count = 0;
					for( var i = 1; i <= problems_count; i++){
						if( (type != "error-problems" && type != "undone-problems"&& type != "random") && typeQus && typeQus.ques && typeQus.ques.length > 0){
							
								var list = typeQus.result || [];
								var l = list.length;
								if( list[i-1] !== null ){
									var status = !!(list[i-1]);
									if( i <= l ){
										if(　status　){
											status = 'success';
											success_count++;
										}else{
											status = 'error';
											error_count++;
										}
									}
								}else{
									status = 'false';
								}
								
							if( typeQus.ques.length < qus_id && i > typeQus.ques.length){
								var list = $topic.getAnswer( type) || [];
								var l = list.length;
								if( i <= l && list[ i - 1] != null && typeof list[ i - 1].status == 'boolean'){
									list = $topic.getAnswer( type) || [];
									if( list[ i - 1].status == true){
										status = 'success';
										success_count++;
									}else if( list[ i - 1].status == false){
										status = 'error';
										error_count++;
									}
								}
							}
							
						}else{
							var status = 'null';
							var list = $topic.getAnswer( type) || [];
							var l = list.length;
							if( i <= l && list[ i - 1] != null && typeof list[ i - 1].status == 'boolean'){
								if( list[ i - 1].status == true){
									status = 'success';
									success_count++;
								}else if( list[ i - 1].status == false){
									status = 'error';
									error_count++;
								}
							}
						}
						if( i == qus_id){
							status = 'current';
						}
						html += '<button class="problems-topic" data-status="'+status+'">'+i+'</button>';
					}
					$('.problems-list-info').empty().append( html);
					$('.success-count').text( success_count);
					$('.error-count').text( error_count);
					$('.problems-count').text( '1-'+ problems_count);
				}else{
					popup.prompt('错误类型！');
				}
				
				//	载入题目内容
				$('.do_problems').attr('data-pattern', pattern);
				switch ( data['qus_type']){
					case '单选题':
					case '多选题':
					case '判断题':
						$('.do_problems').attr('data-type', 'select');
						var tagReg = /<{1}[/]?[^>]*[/]?>{1}/g;
						var type = ( data['qus_type'] == '单选题' || data['qus_type'] == '判断题' )? 'radio': 'checkbox',
							topic = '<b style="color:black;">（'+data['qus_type']+'）</b>'+data['qus_title'].replace( tagReg, ''),
							html = '',
							label = ['A','B','C','D','E','F','G'];
						for( var i = 0,l = data.qus_ans.length; i < l; i++){
							html += [
								'<li>',
								'	<input type="'+type+'" name="answer" id="select_'+label[i]+'" value="'+data.qus_ans[i].ans_id+'">',
								'	<label for="select_'+label[i]+'">',
								'		<div class="name">'+label[i]+'</div>',
								'		<div class="info">'+data.qus_ans[i].ans_connvarchar+'</div>',
								'	</label>',
								'</li>'
							].join('');
						}
						
						$('.problems-name').html( topic );
						$('.problems-select ul').empty().append( html);
						
						// 为类题型添加选中的效果
						if( qusStatus ){
							if( $action.select && $action.select.length ){
								var result_id = data.qus_id;
								
								for( var i = 0, len = $action.select.length; i < len; i++ ){
									if( $action.select[i].id == result_id ){
									
										var arrAns = $action.select[i].ans;
										var correct = $action.select[i].correct;
										var strAns = arrAns.join(',');
										var strCorrect = correct.join(",");
										var $selects = $(".problems-select li");
										var status = strAns === strCorrect ? true : false;
										
										// 显示错误答案
										for( var j = 0, leng = arrAns.length; j < leng; j++ ){
											var ans = arrAns[j];
											$selects.find("input[value='"+ans+"']").attr("data-status","false");
										}
										
										// 显示正确的答案
										for( var j = 0, leng = correct.length; j < leng; j++ ){
											var ans = correct[j];
											$selects.find("input[value='"+ans+"']").attr("data-status","true");
										}
										$(".problems-result").attr("data-status",status)
									}
								}
							}else if( pattern == 'exam' &&　!getUrlParam('type') ){
								var result_id = data.qus_id;
								
								for( var i = 0, len = $data.exam.answer.length; i < len; i++ ){
									if( $data.exam.answer[i].id == result_id ){
									
										var arrAns = $data.exam.answer[i].answer;
										var strAns = arrAns.join(',');
										var $selects = $(".problems-select li");
										
										if( $data.exam.answer[i].status ){
											// 显示正确的答案
											for( var j = 0, leng = arrAns.length; j < leng; j++ ){
												var ans = arrAns[j];
												$selects.find("input[value='"+ans+"']").attr("data-status","true");
											}
										}else{
											// 显示错误答案
											for( var j = 0, leng = arrAns.length; j < leng; j++ ){
												var ans = arrAns[j];
												$selects.find("input[value='"+ans+"']").attr("data-status","false");
											}
										}
										//$(".problems-result").attr("data-status",status)
									}
								}
							}
							
							
						}
						break;
					case '简答题':
					case '论述题':
					case '计算题':
					case '案例题':
						$('.do_problems').attr('data-type', 'reply');
						var topic = '<b style="color:black;">（'+data['qus_type']+'）</b>'+data['qus_title'].replace(/<\/?.+?>/g,""),
							html = '';
						$('.problems-name').html( topic);
						$('.problems-reply [name="answer"]').empty();
						
						// 为类题型添加评论模块
						if( $action.result ){
							var reply = '', score=0;
							if( pattern == "exam" && type != "normal" ){
								var result_id = data.qus_id,ans;
								for( var i = 0, len = $action.result.length; i < len; i++ ){
									for( var key in $action.result[i] ){
										if( key == result_id ){
											ans   = $action.result[i][key];
											reply = $action.result[i].tr_results || "暂无";
											score = $action.result[i].score || 0;
										}
									}
								}
								
								if( $action.result[0].tr_results ){
									$(".select-answer").css("color","#00b25e").text("本题得分:"+score+"分");
									var commet = '<section class="problems-commet"><div class="title">评论</div><div class="info">'+reply+'</div></section>'
								}else{
									$(".problems-result").hide();
								}
								$(".problems-analyze").before(commet);
								$('.problems-reply [name="answer"]').text(ans);
							}
						} else if( qusStatus ){
							if( $action.select && $action.select.length ){
								var result_id = data.qus_id;
								var arrAns;
								for( var i = 0, len = $action.select.length; i < len; i++ ){
									if( $action.select[i].id == result_id ){
										arrAns = $action.select[i].ans;
									}
								}
								$('.problems-reply [name="answer"]').text(arrAns);
							}
						}
						break;
					default:
						popup.prompt( '题目类型异常。（当前类型：'+data['qus_type']+'）');
						break;
				}
					
				// 收藏题目
				$(".collect").on("tap",function(){
					var random = $action.api('api_article_collection',{
						'user_id': window.localStorage.getItem("user_id"),
						'record_id': data.qus_id,
						'collection_type':'qus'
					});
					if( !random.status){
						popup.prompt( random.error);
					}else{
						popup.prompt( random.error);
						if( $(".collect").hasClass('ed') ){
							$(".collect").removeClass('ed');
						}else{
							$(".collect").addClass('ed');
						}
						
					}
					$("#prompt-group-button").hide()
					setTimeout(function(){
						popup.hide();
						$("#prompt-group-button").show()
					},1000);
				});
				
				var collect = we_chat.getStorage('collect')||[];
				for( var i = 0, len = collect.length; i < len; i++ ){
					if( data.qus_id == collect[i] ){
						$(".collect").addClass('ed');
					}
				}
				
				//	添加提交事件
				$('.submit').on( 'tap', function(){
					
					// 如果当前题目做过则跳出本次操作
					if( $(this).attr('data-status') != 'true'){
						return false;
					}
					
					var type = $('.do_problems').attr('data-type');
					var urlType = getUrlParam("type");
					if( type  == 'select'){
						var answer = [];
						$('.problems-select [name="answer"]:checked').each(function(){
							answer.push( $(this).val());
						});
						if( !answer){
							popup.prompt('没有选择答案！');
							return false;
						}
					}else if( type == 'reply'){
						var answer = $('.problems-reply [name="answer"]').text();
						if( !answer && pattern != 'exam'){
							popup.prompt( '回答为空！');
							return false;
						}
					}else{
						return false;
					}
					
					// 考试题但是不是考试题中的查看错题
					if( pattern == 'exam'){
						//	保存本考题答案
						if( !$action.saveExamAnswer( qus_id, answer)){
							return false;
						}
						
//						if( !answer.length && type == 'select' && !getUrlParam('type')){
//							popup.prompt('没有选择答案！');
//							$data.exam.answer.pop();
//							return false;
//						}
						
						// 解决只看错题时的提示问题
						var count = ($(".problems-count").text()).match(/-(\d*)/)[1];
						if( qus_id < parseInt(count) ){
							//	跳到下一道考题
							var type = getUrlParam("type");
							var record_id = getUrlParam("record_id");
							if( type ){
								if(type == "look"){
									var pathData = {
										pattern: pattern,
										type:type,
										paper_id: paper_id,
										qus_id: parseInt( qus_id)+1,
										tree_id:getUrlParam('tree_id')
									}
								}else{
									var pathData = {
										pattern: pattern,
										type:type,
										paper_id: paper_id,
										record_id:record_id,
										qus_id: parseInt( qus_id)+1,
										tree_id:getUrlParam('tree_id')
									}
								}
							}else{
								var pathData = {
									pattern: pattern,
									paper_id: paper_id,
									qus_id: parseInt( qus_id)+1,
									tree_id:getUrlParam('tree_id')
								}
							}
							route.go( {
								module: location.hash.split('?')[0] || '#',
								data: pathData
							});
						}else{
							// 如果只是查看错题
							var type = getUrlParam("type");
							if( !!type ){
								popup.prompt( '已经是最后一题！', [{
									content: '返回首页',
									callback: function(){
										popup.hide();
										route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
									}
								}]);
								return false;
							}
							//	提交考试结果
							var tr_results = {};
							var tr_select = {};
							var tr_status = [];
							for( var i = 0, l = $data.exam.answer.length; i < l; i++){
								
								if( typeof $data.exam.answer[i].answer == 'string'){
									tr_results[ $data.exam.answer[i].id ] = $data.exam.answer[i].answer;
									tr_status.push(2);
								}else{
									tr_select[ $data.exam.answer[i].id ] = $data.exam.answer[i].answer;
									if( $data.exam.answer[i].status ){
										tr_status.push(1)
									}else{
										tr_status.push(0)
									}
									
								}
							}
							
							var s = $action.api( 'api_update_test', {
								tp_id: paper_id,
								user_id: we_chat.getStorage('user_id'),
								tr_score_1: $data.exam.answer_score.radio || 0,
								tr_score_2: $data.exam.answer_score.checkbox || 0,
								tr_short: 0,
								tr_decide: $data.exam.answer_score.decide || 0,
								tr_essay: 0,
								tr_case: 0,
								tr_calculation: 0,
								tr_results: tr_results,
								tr_select: tr_select,
								tree_id: $data.exam.tree_id,
								time: new Date().Format('yyyy-MM-dd hh:mm:ss'),
								tr_error: $data.exam.answer_error,
								tp_class: $data.exam.answer_all_select,
								tr_status:tr_status
							});
							if( s.status){
								popup.prompt( '提交成功！', [{
									content: '查看结果',
									callback: function(){
										popup.hide();
										route.go( {	module: '#exam/result',
													data:{record_id:s.data,tree_id:getUrlParam('tree_id')}});
									}},{
									content: '返回首页',
									callback: function(){
										popup.hide();
										route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
									}
								}]);
								window.localStorage.removeItem('exam_data');
							}else{
								popup.prompt( s.error || '提交考试失败！');
							}
						}
					}else{
						var topic_type = getUrlParam( 'type');
						
						//	保存本题答案
						if( !$topic.saveAnswer( topic_type, qus_id, answer)){
							popup.prompt( '保存答案失败！');
							return false;
						}
						//	获取本题是否正确
						var answer = $topic.getAnswer( topic_type, qus_id);
						$('.main-content').attr('data-answer', 'true');
						nextBind( qus_id, problems_count );
						showAnwser(data,answer.status);
						
					}
				});
				
				$('.problems-topic').on( 'tap', function(){
					
					// 如果是点击tap后跳转的习题集,则做需要实现显示selection的操作flage
					$action.isTap = true;
					
					// 控制题目列表是否执行点击跳转操作
					var urlType = getUrlParam('type');
					if( ((urlType != "error-problems" && urlType != "undone-problems" &&　urlType != "collect-problems") && ( $(this).attr('data-status') != 'error' && $(this).attr('data-status') != 'success') ) ){
						return;
					}
					if( $(this).attr('data-status') == 'current'){
						return false;	
					}
				
					// 实现跳转具体的某一道习题
					var qus_id = $(this).text();
					if( pattern == 'exam'){
						if( urlType ){
							route.go( {
								module: location.hash.split('?')[0] || '#',
								data: { pattern: pattern, type:urlType, paper_id: paper_id || 0, qus_id: qus_id,tree_id:getUrlParam('tree_id')}
							});
						}else{
							route.go( {
								module: location.hash.split('?')[0] || '#',
								data: { pattern: pattern, paper_id: paper_id || 0, qus_id: qus_id,tree_id:getUrlParam('tree_id')}
							});
						}
					}else{
						route.go( {
							module: location.hash.split('?')[0] || '#',
							data: { pattern: pattern, type: getUrlParam('type') || 0, qus_id: qus_id, tree_id: getUrlParam('tree_id')}
						});
					}
				});
				
				/**
				 * 为下一题绑定事件
				 * @param {number} qus_id: 题目id
				 * @param {number} problems_count：题目总数
				 * @param {string} type：下一题的类型,type=='exam'表示此处是考试的下一题
				 */
				function nextBind( qus_id, problems_count, type){
					var $oSubmit = $('.submit');
					$oSubmit.removeAttr( 'data-status').text('下一题');
					$oSubmit.off("tap").on( 'tap', function(){
						var next_number = parseInt(qus_id) + 1;
						if( next_number > problems_count ){
							var urlType = getUrlParam('type');
							
							if( urlType == 'order' ){
								popup.prompt( '已经是最后一题！', [{
									content: '清除所有做题记录',
									callback: function(){
										popup.hide();
										var c = $action.api("api_del_record",{user_id:we_chat.getStorage('user_id'),tree_id:getUrlParam('tree_id')})
										if( c.status ){
											popup.prompt( '清除成功!', [{
												content: '返回首页',
												callback: function(){
													popup.hide();
													route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
												}
											}])
										}else{
											popup.prompt( '清除成功!', [{
												content: '返回首页',
												callback: function(){
													popup.hide();
													route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
												}
											}])
										}
									}
								},{
									content:'跳转到错题集',
									callback:function(){
										popup.hide();
										$topic._getTopic( 'error-problems')
										$topic.data.answer['error-problems'] = [];
										route.go( {	module: '#exam/do_problems',data:{tree_id:getUrlParam('tree_id'),pattern:'practice',type:'error-problems'}});
									}
								}]);
							}else{
								popup.prompt( '已经是最后一题！', [{
									content: '返回首页',
									callback: function(){
										popup.hide();
										route.go( {	module: '#exam/index',data:{tree_id:getUrlParam('tree_id')}});
									}
								}]);
							}
							
							return false;
						}
						
						// 配置跳转到考试题目,或者普通练习题题目
						var data ={
							pattern: pattern, 
							qus_id: next_number, 
							tree_id:getUrlParam('tree_id')
						};
						if( type === 'exam' ){
							data.paper_id = getUrlParam('paper_id');
						}else{
							data.type = getUrlParam('type')
						}
						route.go({
							module: location.hash.split('?')[0] || '#',
							data: data
						});
					});
				}
				
				/**
				 * 为做过的题目显示答案
				 * @param {Object} data：题目详情
				 * @param {Object} status:题目的显示状态
				 */
				function showAnwser(data,status){
					if( $.isArray( data.qus_ans) && data.qus_ans.length > 0){
						$('.problems-result').attr('data-is-select', true);
						//	本题正确答案
						var success = '',
							label = ['A','B','C','D','E','F','G'];
						for( var i = 0, l = data.qus_ans.length; i < l; i++){
							if( data.qus_ans[i].ans_is_correct == 1){
								success += label[i]+'、';
							}
						}
						success = success.substr( 0, success.length - 1);
						$('.problems-result .select-answer').text( '本题正确答案为：'+success);
					}else{
						$('.problems-result').attr('data-is-select', false);
					}
	
					$('.problems-result').attr( 'data-status', status);
					$('.problems-analyze .info').text( data.kn_explain || "");
					$('.problems-reference .info').text( data.qus_explain || "");
				}
			}
		},
		'#exam/result_list': {
			template_url: 'exam/exam_result_list.html',
			onBefore: $action.isPower,
			onLoad: function(){
				var $wrapper = $(".main-content");
				var loadList = function( page, limit){
					var s = $action.api( 'api_get_user_record', { user_id: we_chat.getStorage('user_id'), page_start: page, page_size: limit,tree_id:getUrlParam('tree_id')});
					if( !s.status){
						popup.prompt( s.error);
						return false;
					}
					
					// 初始化上拉加载的部件及其数据
					loadMore.initLoad( $wrapper, page, s.data.count, limit );

					var list = s.data.content,
						tp_list = [],
						html = '';
					for( var i = 0, l = list.length; i < l; i++){
						if( list[i].mar_king_status == 0){
							var status = false,
								score = '阅卷中';
						}else{
							var status = true,
								score = parseInt( list[i].tr_score_1)
									+ parseInt( list[i].tr_score_2)
									+ parseInt( list[i].tr_short)
									+ parseInt( list[i].tr_decide)
									+ parseInt( list[i].tr_essay)
									+ parseInt( list[i].tr_calculation)
									+ parseInt( list[i].tr_case)
									+ '分';
						}
						html += [
							'<li class="R-go" path="#exam/result" path-data="{\'record_id\':\''+list[i].tr_id+'\',\'tree_id\':\''+getUrlParam("tree_id")+'\'}">',
							'	<span class="title">'+list[i].tp_name+'</span>',
							'	<span class="remark" data-status="'+status+'">'+score+'</span>',
							'	<span class="exam-date">考试时间:'+list[i].tr_crt_time+'</span>',
							'	<span class="look-date">阅卷时间:'+( list[i].mar_king_time || '未阅' )+'</span>',
							'</li>'
						].join('');
					}
					if( page == 1){
						$('.main-content ul').empty().append( html);
					}else{
						$('.main-content ul').append( html);
					}
				}
				loadList( 1, 20);
				
				$wrapper.on("swipeUp",function(){
					loadMore.handler( $wrapper, loadList,20)
				})
				
			}
		},
		'#exam/result': {
			template_url: 'exam/exam_result.html',
			onBefore: $action.isLogin,
			onLoad: function(){
				var record_id = getUrlParam( 'record_id');
				if( typeof record_id == 'undefined'){
					route.back();
					return false;
				}
				var s = $action.api( 'api_get_testrecord', { tr_id: record_id});
				if( !s.status){
					popup.prompt( s.error);
					return false;
				}
				var all_select = s.data.tp_class == '0'? 'false': 'true',
					look_status = s.data.mar_king_status == '0'? 'false': 'true';

				$('.main-content').attr( 'data-all-select', all_select).attr( 'data-look-status', look_status);
				
				var tr_radio = parseInt( s.data.tr_score_1),
					tr_checkbox = parseInt( s.data.tr_score_2),
					tr_decide = parseInt( s.data.tr_decide),
					tr_short = parseInt( s.data.tr_short),
					tr_essay = parseInt( s.data.tr_essay),
					tr_calculation = parseInt( s.data.tr_calculation),
					tr_case = parseInt( s.data.tr_case),
					
					// 单选+多选得分
					select_total = tr_radio + tr_checkbox,
					total = select_total + tr_short + tr_essay + tr_calculation + tr_case+tr_decide;
				
				// 将考试结果存储在一个变量中
				$action.result = s.data.tr_data;
				$action.select = s.data.tr_select;
				$action.status = s.data.tr_status;
				
				$('.yesOrNo .score-label').text( tr_decide+'分');
				$('.yesOrNo .score-label').text( tr_decide+'分');
				$('.score-select-total .score-label').text( select_total+'分');
				$('.short-answer .score-label').text( tr_short+'分');
				$('.discuss .score-label').text( tr_essay+'分');
				$('.calculate .score-label').text( tr_calculation+'分');
				$('.case .score-label').text( tr_case+'分');
				$('.score-total .score-label').text( total+'分');
				
				// 控制查看试卷的跳转
				
				var path_data = "{'pattern':'exam','paper_id':'"+s.data.tp_id+"','tree_id':'"+getUrlParam('tree_id')+"'}";
				$(".look-problems").attr("path-data","{'pattern':'exam', 'type': 'look', 'paper_id':'"+s.data.tp_id+"','tree_id':'"+getUrlParam('tree_id')+"'}");
				$('.again-problems').attr("path-data",path_data);
				$('.error-problems').addClass('R-go')
				.attr('path','#exam/do_problems')
				.attr('path-data', "{'pattern':'exam', 'type': 'error', 'paper_id':'"+s.data.tp_id+"','record_id':'"+getUrlParam('record_id')+"','tree_id':'"+getUrlParam('tree_id')+"'}");
			
				$(".again-problems").on("tap",function(){
					$data.exam.answer = [];
				})
			}
		},
		'#exam/guide': {
			template_url: 'exam/guide.html',
			onBefore: $action.isPower,
			onLoad: function(){
				var collection = getUrlParam("collection"),
					userInfo = JSON.parse( window.localStorage.getItem("user_info")),
				    $wrapper = $(".main-content"),
				    tree_id = getUrlParam('tree_id'),
				    searchList;
				    
				function joinStr( data, page, limit ){
					if( data.status){
						var list = data.data.content,
							l = list.length,
							html = '';
							
						// 初始化上拉加载的部件及其数据
						loadMore.initLoad( $wrapper, page, data.data.count, limit );
						
						for( var i = 0; i < l; i++){
							var title = list[i].acl_title || '',
								exp = list[i].acl_text || '',
								acl_id = list[i].acl_id;
								
								// 删除返回数据中的标签
								exp = exp.replace(/<{1}[/]?[^>]*[/]?>{1}/g,'');
							html += [
								'<div class="info R-go" path="#exam/guideDetail" path-data="{acl_id:'+acl_id+'}">',
								'	<div class="info-title">'+title+'</div>',
								'	<div class="info-describe">'+exp+'</div>',
								'</div>'
							].join('');
						}
						if( page == 1){
							$('.info-list').empty().append( html);
						}else{
							$('.info-list').append( html);
						}
						return true;
					}
					return false;
				}
				
				// 如果collection为true则显示收藏的考试指示情况
				if( collection !== "true" ){
					loadList = function( tree_id, page, limit){
						var data = $action.api('api_guide_tree_info',{tree_id:tree_id,page_start:page,page_size:limit});
						joinStr( data,page,limit );
					}
					loadList( getUrlParam("tree_id"), 1, 20);
				}else{
					$(".search").hide();
					$(".label-list").hide();
					var loadList = function( user_id, type, page, limit){
						var data = $action.api('api_get_collection',{user_id:user_id,collection_type:type,page_start:page,page_size:limit});
						
						if( data.status){
							var list = data.data.content,
								l = list.length,
								html = '';
							for( var i = 0; i < l; i++){
								var title = list[i].content.acl_title || '',
									content = list[i].content.acl_text || '',
									acl_id = list[i].content.acl_id;
									
								// 删除返回数据中的标签
								content = content.replace(/<{1}[/]?[^>]*[/]?>{1}/g,'');
								html += [
									'<div class="info R-go" path="#exam/guideDetail" path-data="{acl_id:'+acl_id+'}">',
									'	<div class="info-title">'+title+'</div>',
									'	<div class="info-describe">'+content+'</div>',
									'</div>'
								].join('');
							}
							if( page == 1){
								$('.info-list').empty().append( html);
							}else{
								$('.info-list').append( html);
							}
							return true;
						}
						return false;
					}
					loadList(userInfo.user_id,'ks',1,20);
				}
				
				$wrapper.on("swipeUp",function(){
					if( $('input[name="search"]').val() !== '' ){
						var keyWord = $('input[name="search"]').val();
						loadMore.handler( $wrapper, searchList,20,tree_id, keyWord);
					}else{
						loadMore.handler( $wrapper, loadList,20, tree_id )
					}
				})
			
				// 搜索考试指南
				$('input[name="search"]').change(function(){
					var keyWord = $(this).val();
					searchList = function( tree_id, keyWord, page, limit){
						var data = $action.api('api_search_zn',{tree_id:tree_id,keyword:keyWord,page_start:page,page_size:limit});
							joinStr( data,page,limit );
					}
					searchList( tree_id, keyWord, 1, 20)
				});
			}
		},
		
		'#exam/guideDetail': {
			template_url: 'exam/guide_detail.html',
			onLoad: function(){

				var acl_id = getUrlParam("acl_id");
				var loadList = function( acl_id){
					var data = $action.commonApi('api_article',{acl_id:acl_id});
					if( data.status){
						//var con = (data.data.acl_text).replace(/<{1}[/]?[^>]*[/]?>{1}/g,'');
						
						$(".content").append( data.data.acl_text );
						$(".guide_title").text( data.data.acl_title);
						
						
						var str = '';
						var s = $action.commonApi('api_article_reply',{acl_id:acl_id,page_start:1,page_size:8,type:'top'});
						if( !s.status ){
							popup.prompt( s.error);
							return false;
						}else{
							var list = s.data.content,
								str = '';
							$(".comment").text( "("+s.data.count+")");
							for( var i = 0, len = list.length; i < len; i++){
								str += '<li class="specialist"><div class="specialist-photo"><img src="'+list[i].user_photo+'" width="100%" height="100%" alt="图片"/>'+
									   '</div><div class="specialist-base"><div class="name">'+list[i].user_name+'</div><div class="time">'+list[i].reply_time+'</div>'+
									   '<div class="con" title="'+list[i].reply_content+'">'+list[i].reply_content+'</div></div></li>';
							}
							$(".specialist-list ul").empty().append(str);

						}
					}
				}
				loadList( acl_id);
				var userInfo = JSON.parse( window.localStorage.getItem("user_info"));
				$(".user_comment_btn").on("click",function(){
					var val = $(this).siblings("input").val();
					var userInfo = JSON.parse( window.localStorage.getItem("user_info"));
					if(!val){
						popup.prompt("请填写你要发送的内容");
						return false;
					}
					var data = $action.api('api_add_notes_reply',{
						acl_id:acl_id,
						user_id:userInfo.user_id,
						user_photo:userInfo.user_photo,
						user_name:userInfo.user_name,
						user_type:userInfo.user_type,
						reply_content:val,
						reply_type:'top'
					});
					
					if( data.status ){
						$(this).siblings("input").val('');
						loadList( acl_id);
					}else{
						popup.prompt( data.error);
					}
				})
				
				// 对评论内容做字符限制
				$(".user_comment_content").on("input",function(){
					var txt = $(this).val();
					if( txt.length > 150 ){
						popup.prompt( "当前评论超过字符限制!");
						txt = txt.substr(0,2);
						$(this).val( txt );
					}
				})
				
				// 添加收藏
				$(".collect").on("tap",function(){
					var random = $action.api('api_article_collection',{
						'user_id': window.localStorage.getItem("user_id"),
						'record_id': acl_id,
						'collection_type':'ks'
					});
					if( !random.status){
						popup.prompt( random.error);
					}else{
						popup.prompt( random.error);
						if( $(".collect").hasClass('ed') ){
							$(".collect").removeClass('ed');
						}else{
							$(".collect").addClass('ed');
						}
					}
					$("#prompt-group-button").hide()
					setTimeout(function(){
						popup.hide();
						$("#prompt-group-button").show()
					},1000);
				});
				
				
				var status = $action.api('api_get_usercollection_status',{
						'user_id': window.localStorage.getItem("user_id"),
						'record_id': acl_id,
						'collection_type':'ks'
					});
					
				if( status.status){
					if( status.error == '已收藏' ){
						$(".collect").addClass('ed');
					}
				}
			}
		},
			
		'#specialist/search': {
			template_url: 'specialist/search.html',
			onLoad: function(){
				var loadList = function( type){
					if( type == '行业'){
						var tree_name = '业务分类';
					}else if( type == '领域'){
						var tree_name = '领域分类';
					}else{
						return false;
					}
					var s = $action.commonApi( 'api_get_tree', { tree_name: tree_name});
					if( !s.status){
						popup.prompt( s.error);
						return false;
					}
					var html = '';
					for( var i = 0, l = s.data.length; i < l; i++){
						html += '<div class="select R-go" path="#specialist/list" path-data="{ \'type\': \''+type+'\', \'id\':\''+s.data[i].tree_id+'\'}">'+s.data[i].tree_name+'</div>';
					}
					$('.select-list').empty().append( html);
					return true;
				}
				
				loadList( '行业');
				
				$( '.label').on( 'tap', function(){
					var type = $( this).attr( 'data-type');
					
					if( loadList( type)){
						$( '.label-list .label[data-curr]').removeAttr( 'data-curr');
						$( this).attr( 'data-curr','');
					};
				});
			}
		},
		'#specialist/list': {
			template_url: 'specialist/list.html',
			onLoad: function(){
				var loadList = function( page, limit, name, f_id, v_id){
					var s = $action.commonApi(
						'api_search_exp',
						{
							page_start: page,
							page_size: limit,
							user_name: name,
							tree_id_field: v_id,
							tree_id_business: f_id
						});
					if( !s.status){
						popup.prompt( s.error);
						return false;
					}
					var list = s.data.content,
						html = '';
					if(list.length==0){
						$('.specialist-list ul').empty().append("<section style='text-align: center; padding: 1rem; background: #fff;width:100%;'>没有找到</section>");
						return false;
					}
					for( var i = 0, l = list.length; i < l; i++){
						if(list[i].user_id == we_chat.getStorage("user_id")) continue;
						html += [
							'<li class="specialist R-go" path="#personal/expert_homepage" path-data="{\'user_id\':\''+list[i].user_id+'\'}">',
							'	<div class="specialist-photo">',
							'		<img src="'+list[i].user_photo+'" width="100%" height="100%" alt="图片">',
							'	</div>',
							'	<div class="specialist-base">',
							'		<div class="name">'+list[i].user_name+'</div>',
							'		<div class="title">'+list[i].user_professional+'</div>',
							'		<div class="org">'+list[i].exp_org+'</div>',
							'		<div class="explain">'+list[i].exp.exp_intro+'</div>',
							'	</div>',
							'</li>'
						].join('');
					}
					if( page == 1){
						$('.specialist-list ul').empty().append( html);
					}else{
						$('.specialist-list ul').after( html);
					}
				}
				
				var type = getUrlParam('type'),
					v_id = '',
					f_id = '',
					name = '',
					id = getUrlParam('id');
				type	== "行业"?v_id = id:f_id = id;
				
				loadList( 1, 10, name, v_id, f_id);
				
				$('input[name="search"]').change( function(){
					name = $(this).val();
					loadList( 1, 10, name, v_id, f_id);
				});
			}
		},
//		'#specialist/info':{
//			template_url: 'specialist/info.html',
//			onBefore: $action.isLogin,
//			onLoad: function(){
//				var id = getUrlParam('user_id');
//				if( !user_id){
//					route.back();
//					return false;
//				}
//				var s = $action.api( 'api_get_userInfo', { user_id: id});
//				if( !s.status){
//					popup.prompt( s.error);
//					return false;
//				}
//				
//			}
//		},
		'#activity/list': {
			template_url: 'activity/list.html',
			onLoad: function(){
				$wrapper = $(".main-content");
				var loadList = function( p, limit){
					var s = $action.commonApi( 'api_get_trainning', { page_start: p, page_size: limit});
					if( !s.status){
						popup.prompt( s.error);
					}else{
						var list = s.data.content,
							l = list.length,
							html = '';
							
						// 初始化上拉加载的部件及其数据
						loadMore.initLoad( $wrapper, p, s.data.count, limit );
						
						for( var i = 0; i < l; i++){
							var path_data = "{'training_id': '"+list[i].training_id+"'}";
							if( list[i].training_status == 'stop'){
								var status = false,
									status_text = '报名关闭';
							}else if( list[i].training_status == 'delay' ){
								var status = false,
									status_text = '敬请期待';
							}else{
								var status = true,
									status_text = '现在报名';
							}
							html += [
								'<li class="R-go" path="#activity/info" path-data="'+path_data+'">',
								'	<span class="title">'+list[i].training_title+'</span>',
								'	<span class="date">'+new Date( list[i].entered_start * 1000).Format('yyyy/MM/dd')+'-'+new Date( list[i].entered_end * 1000).Format('yyyy/MM/dd')+'</span>',
								'	<span class="status" data-status="'+status+'">'+status_text+'</span>',
								'</li>'
							].join('');
						}
						if( p == 1){
							$('.main-content ul').empty().append( html);
						}else{
							$('.main-content ul').append( html);
						}
						return true;
					}
					return false;
				}
				loadList( 1, 15);
				
				$wrapper.on("swipeUp",function(){
					loadMore.handler( $wrapper, loadList,15)
				})
			}
		},
		'#activity/info': {
			template_url: 'activity/info.html',
			onLoad: function(){
				var training_id = getUrlParam('training_id'),
					s = $action.commonApi('api_trainning_detail', { train_id: training_id});
					user_id = window.localStorage.getItem("user_id");
				if( !s.status){
					popup.prompt( s.error);
				}else{
					$('.container .title').text( s.data.training_title);
					$('.container .date').html( '报名时间<br />'+new Date( s.data.entered_start*1000).Format('yyyy-MM-dd')+' —— '+new Date( s.data.entered_end*1000).Format('yyyy-MM-dd'));
					$('.container .explain').html( s.data.content);
					
					if( s.data.tree_name.length ){
						var str = '';
						for( var i = 0, len = s.data.tree_name.length; i < len; i++ ){
							str += '<p>'+s.data.tree_name[i]+'</p>'
						}
						$('.container .tree_names').append( str );
					}
					$('.container .price').html("报名费用<br /><span style='color:red;'>&yen;"+s.data.enroll_amount+"</span>" ).data('price',s.data.enroll_amount);
					we_chat.setStorage('price',s.data.enroll_amount)
					// 获取此用户在当前的活动的报名情况
					var m = $action.api( 'api_get_activitystatus', { train_id: training_id,user_id:user_id});
					if( m.error=='已经报名' || m.error=='报名未开始'?true:false ){
						$('.container-box button').attr( 'data-status', false );
						$('.container-box button').attr("data-text",m.error);
						return false;
					}
					
					$('.container-box button').attr( 'data-status', s.data.training_status == 'stop'? false: true)
					if( $('.container-box button').attr('data-status') == "true"){
						$('.container-box button').attr("data-text","我要报名")
					}else{
						$('.container-box button').attr("data-text","已截止")
					}
					
					$('.container-box button').click(function(){
						if( $(this).attr('data-status') == "true"){
							if( !$action.isLogin() ){
								return false;
							}	
							var s = $action.api( 'api_entered_detail', { training_id: training_id,user_id:user_id});
							if( !s.status){
								if( s.error == '登录超时' ){
									window.location.href="../../thirdlogin/weixin_log.php";
								}else{
									popup.prompt( s.error,[
									{content:'返回上一页', callback: function(){ popup.hide();route.back();}},
									{content:'确定'}]);
								}
							}else{
								window.location.href = '../../pay/jsapi.php?pay_id='+training_id+'&user_id='+user_id+'&type=training&showwxpaytitle=1';
								we_chat.setStorage('training',training_id)
							}
						};
					});
					
					//调用微信JS api 支付
					function jsApiCall( param )
					{
						WeixinJSBridge.invoke(
							'getBrandWCPayRequest',
							param,
							function(res){
								WeixinJSBridge.log(res.err_msg);
								alert("getBrandWCPayRequest:"+res.err_code+res.err_desc+res.err_msg);
							}
						);
					}
				
					function callpay( param )
					{
						if (typeof WeixinJSBridge == "undefined"){
						    if( document.addEventListener ){
						        document.addEventListener('WeixinJSBridgeReady', jsApiCall, false);
						    }else if (document.attachEvent){
						        document.attachEvent('WeixinJSBridgeReady', jsApiCall); 
						        document.attachEvent('onWeixinJSBridgeReady', jsApiCall);
						    }
						}else{
						    jsApiCall( param);
						}
					}
				}
			}
		},
		
		'#personal/index'					: 'personal/index.html',
		'#personal/my_notes'				: 'personal/my_notes.html',
		'#personal/my_exam'					: 'personal/my_exam.html',
		'#personal/my_work'					: 'personal/my_work.html',
		'#personal/my_article'				: 'personal/my_article.html',
		'#personal/question_answer'			: 'personal/question_answer.html',
		'#personal/my_help'					: 'personal/my_help.html',
		'#personal/purchase_information'	: 'personal/purchase_information.html',
		'#personal/my_collection'			: 'personal/my_collection.html',
		'#personal/modify_password'			: 'personal/modify_password.html',
		'#personal/clear_cache'				: 'personal/clear_cache.html',
		'#personal/version_upgrade'			: 'personal/version_upgrade.html',
		'#personal/my_information'			: 'personal/my_information.html',
		'#personal/add_information'			: 'personal/add_information.html',
		'#personal/online_consulting'		: 'personal/online_consulting.html',
		'#personal/details_problem'			: 'personal/details_problem.html',
		'#personal/notes_info_details'		: 'personal/notes_info_details.html',
		'#personal/write_notes'				: 'personal/write_notes.html',
		'#personal/expert_articles_page'	: 'personal/expert_articles_page.html',
		'#personal/literature_page'			: 'personal/literature_page.html',
		'#personal/wirte_works'				: 'personal/wirte_works.html',
		'#personal/user_recharge'			: 'personal/user_recharge.html',
		'#personal/profile_name'			: 'personal/profile_name.html',
		'#personal/user_rating'				: 'personal/user_rating.html',
		'#personal/online_consultation'		: 'personal/online_consultation.html',
		'#personal/user_login'				: 'personal/user_login.html',
		'#personal/user_registers'			: 'personal/user_registers.html',
		'#personal/user_register'			: 'personal/user_register.html',
		'#personal/personal_settings'		: 'personal/personal_settings.html',
		'#personal/identity_authentication'	: 'personal/identity_authentication.html',
		'#personal/personal_partake'	  	: 'personal/personal_partake.html',
		'#personal/personal_homepage'		: 'personal/personal_homepage.html',
		'#personal/station_message'			: 'personal/station_message.html',
		'#personal/write_information'		: 'personal/write_information.html',
		'#personal/write_article'			: 'personal/write_article.html',
		'#personal/expert_homepage'			: 'personal/expert_homepage.html',
		'#personal/expert_detail'			: 'personal/expert_detail.html',
		'#personal/details_problem_before'	: 'personal/details_problem_before.html',
		'#personal/user_evaluation'			: 'personal/user_evaluation.html',
		'#personal/share'					: 'personal/share.html',
	});
	
	
	
	route.setup({
		module: '#',
		title: '编辑邦',
		data: null,
		timeout: 3000,
//		onAfter: function(){
//			console.log('默认后置');
//		},
//		onProgress: function(){
//			console.log('默认载入中');
//		},
//		onBefore: function(){
//			console.log('默认前置');
//		},
		onSuccess: function( html){
			var ms = 600,
				_self = this;
				_self.animation = true,
				load_complete = false;
			switch( this.status){
				case 'reload':
					$('.lay').empty().append( html);
					load_complete = true;
					break;
				case 'forward':
				case 'back':
					$('.lay').empty().append( html);
					load_complete = true;
					
//					var o = $('.lay:eq(0)'),
//						w = o.width(),
//						h = o.height(),
//						diameter = diameter = Math.ceil( Math.sqrt( w*w+h*h));
//						
//					o.after([
//						'<section class="lay" style="z-index: 3;">',
//						'	<div id="lay-shade">',
//						'		<div id="lay-container">',
//						html,
//						'		</div>',
//						'	</div>',
//						'</section>'
//					].join(''));
//					
////					$('.lay:eq(1)').find('#lay-shade').css({
////						'margin-top': '-1rem',
////						'margin-left': '-1rem',
////						'width': '2rem',
////						'height': '2rem',
////						'border-radius': '50%',
////						'transition-duration': ms+'ms'
////					});
//					$('.lay:eq(1)').find('#lay-container').css({
//						'width': w+'px',
//						'height': h+'px',
//						'position' : 'absolute',
//					    'top': '0',
//					    'left': '0',
//					    'right': '0',
//					    'bottom': '0',
//					    'margin': 'auto'
//					});
//					setTimeout(function(){
////						$('.lay:eq(1)').find('#lay-shade').css({
////							'width': diameter+'px',
////							'height': diameter+'px',
////							'margin-top': -Math.ceil( diameter/2)+'px',
////							'margin-left': -Math.ceil( diameter/2)+'px'
////						});
//						
//						setTimeout(function(){
//							$('.lay:eq(0)').remove();
//							$('.lay:eq(0)').css({'z-index':'2'});
//							$('#lay-shade').css({
//								'transition-duration': '',
//								'margin': '0',
//								'width': '100%',
//								'height': '100%',
////								'border-radius': 'initial',
//								'top': '0',
//								'left': '0',
//	//							'overflow': 'initial'
//							});
//							$('#lay-container').css({
//								'width': '100%',
//								'height': '100%'
//							});
//							load_complete = true;
//						}, ms);
//					}, 0);
//					break;
			}
			var _id = setInterval(function(){
				if( load_complete){
					$('.main-content').attr( 'data-show', true);
					if( typeof _self.onLoad == 'function' ){
						try{
							if( _self.module == '#exam/index' || _self.module == '#exam/do_problems'){
								var data_complete = false;
								var modal_bg = "<div class='modal_bg' style='width:100%;height:100%;background:rgba(0,0,0,.4);position:absolute;top:0;left:0;z-index:99;display:table'><p style='color:#fff;text-align:center;display:table-cell;vertical-align:middle'>正在加载中...</p></div>"
								$("body").append( modal_bg );
							}
							
							setTimeout(function(){
								_self.onLoad();
							
								if( $(".modal_bg").length ){
									$(".modal_bg").remove()
								}
							},10)
							
						}catch(e){
							console.error( e.message);
						}
					}
					clearInterval( _id);
					_self.animation = false;
				}
			}, 16);
			
			//跳转成功后执行的选中底部菜单
			var currentPath		= "#"+window.location.href.split("#")[1].split("?")[0];
			var list			= $("#nav").find("li");
			for(var i=0;i<list.length;i++){
				if(list.eq(i).attr("path") == currentPath){
					list.eq(i).attr("data-status",true).siblings().attr("data-status",'');
				}
			}
	
			
		},
//		onError: function(){
//			console.log('默认失败');
//		},
//		onTimeout: function(){
//			console.log('默认超时');
//		}
	});
	
	

	
	
	route.go({
		module: location.hash.split('?')[0] || '#',
		history: false,
		status: 'reload'
	});
	
	$(document)
	.on( 'tap', '.R-go', function(e){
		var m = $(this).attr('path');
		try{
			eval( "var data = "+$(this).attr('path-data'));
		}catch(e){
			console.error( e.message);
		}
		if( m){
			route.go({ module: m, data: data || {}, status: 'forward'});
		}else{
			console.error( 'm 为空！');
		}
		e.preventDefault();
	})
	.on( 'tap', '.R-back', function(){
		route.back();
	})
	.on( 'tap', '.R-forward', function(){
		route.forward();
	})
	.on( 'tap', '.enlarge_picture', function(){
		popup.init();
		$("<img src='"+$(this).attr('src')+"'><button type='button' class='beSure'>关闭</button>").appendTo($("#popup-bg"));
		$("#popup").show();
		$("#popup-content").hide();
	});
	
	route.go({
		module: '#popup',
		history: false,
		status: 'load',
		onSuccess: function( html){
			$('body').append( html);
		}
	});
})(this);