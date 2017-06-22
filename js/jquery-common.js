/* ! jQuery-common?v1.0 2016-05-20 */
// writer shoko

$(document).ready(function(){
  //clickShowHide('.index-head .icon-button','.index-head section nav',400);
	//tab('.index-news-lists ul','.index-news-lists ol');          // 选项卡
  //checkBox();     // 购物车
  //reviewsBox("#reviewsbox","a","sel");//评价星星
  //signIn();       // 弹窗
  //lookMore();
  //newslistHover();
  //listMove();
});

//html font-size(rem)
function setRootSize(){
  var deviceWidth = document.documentElement.clientWidth; 
  //if(deviceWidth > 640){deviceWidth = 640;}
  //document.documentElement.style.fontSize = deviceWidth / 6.4 + 'px';
  if(deviceWidth > 720){deviceWidth = 720;}
  document.documentElement.style.fontSize = deviceWidth / 7.2 + 'px';
}
setRootSize();
window.addEventListener('DOMContentLoaded', function(){
  setRootSize();
}, false);
$(document).ready(function(){
  setRootSize();
});

// 弹窗
function popOpen(openName){
  $(openName).show();
}

function popClose(){
  $('.pop-ups').hide();
}

/*// 图片宽高
window.onload = function(){

};*/

// 点击显示，再点击隐藏
function clickShowHide(button,showOne,showTime){
  var btn =true;
  $(button).click(function(){
    if(btn){
      $(showOne).slideDown(showTime);  
    }else{
      $(showOne).slideUp(showTime);  
    };
    btn = !btn;
  });
}


// 选项卡
function tab(tabTitle,tabList){
  $(tabTitle).on('click','a',function(){
    var $self = $(this);//当前a标签
    var $active = $self.closest('li');//当前点击li
    var index = $active.prevAll('li').length;//当前索引

    $active.addClass('active').siblings('li').removeClass('active');
    $(tabList).find('>li')[index==-1?'show':'hide']().eq(index).show();
  });
};

// check多选
function checkBox(){
  $(".shopp-car ul").click(function(){
    var cssattr= $(this).find("li.left").attr("class");

    if(cssattr.indexOf("checked")>0){
      $(this).find("li.left > input[type='checkbox']").removeClass("check");
      $(this).find("li.left").removeClass("checked");
    }else{
      $(this).find("li.left > input[type='checkbox']").addClass("check");
      $(this).find("li.left").addClass("checked");
    }      
  });
};

// 查看更多
function lookMore(){
  // 查看更多
  var onOne = true;
  $(".goods-filter .top-filter a.look-more").click(function(){
    if(onOne){
      $(this).html("收起 ^");
      $(this).parent(".goods-filter .top-filter").css("height","auto");
      $(this).parent(".goods-filter .top-filter").css("paddingBottom","15px");
    }else{
      $(this).html("更多 V");
      $(this).parent(".goods-filter .top-filter").css("height","30px");
      $(this).parent(".goods-filter .top-filter").css("paddingBottom","0");
    };
    onOne = !onOne;
  });

  var onTwo =true;
  $(".goods-filter .filters .filter-one a.look-more").click(function(){
    if(onTwo){
      $(this).html("收起 ^");
      $(this).parent(".goods-filter .filters .filter-one").css("height","auto");
      $(this).parent(".goods-filter .filters .filter-one").css("paddingBottom","15px");
    }else{
      $(this).html("更多 V");
      $(this).parent(".goods-filter .filters .filter-one").css("height","30px");
      $(this).parent(".goods-filter .filters .filter-one").css("paddingBottom","0");
    };
    onTwo = !onTwo;
  });

  // 展开
  var onThree =true;
  $(".view-logistics .logistic-info .order-number div.wuliu a").click(function(){
    if(onThree){
      $(this).html("收起");
      $(this).addClass("pack-up");
      $(".view-logistics .logistic-info .order-number div.wuliu-lists").show();
    }else{
      $(this).html("展开");
      $(this).removeClass("pack-up");
      $(".view-logistics .logistic-info .order-number div.wuliu-lists").hide();
    };
    onThree = !onThree;
  });

};

// 新闻资讯列表模式
function newslistHover(){
  var $listOne = $("#tab-ol-3 .li-way-two .lists-one");

  // 鼠标经过
  $listOne.mouseover(function(){
      $(this).find(".div1").animate({marginTop:"30px"},500);
      $(this).find(".div2").hide();
      $(this).find(".div3").animate({bottom:"0"},500);
  });
  // 鼠标离开
  $listOne.mouseout(function(){
    $(this).find(".div1").stop(true,true).animate({marginTop:"70px"},500);
    $(this).find(".div2").show();
    $(this).find(".div3").stop(true,true).animate({bottom:"-110px"},500);
  });
};

//列表滑动
function listMove(){
  var i = 0;
  var moveL = 870/7;
  var length = $("#index_news ol li").length;

  $("#index_next").click(function(){
    i++;
    if(i > length - 7){
      i = length -7;
    };
    var index = i * moveL;
    $("#index_news ol").animate({left:-index+"px"},500);               
  });
  $("#index_last").click(function(){
    i--;
    if(i < 0){
      i = 0;
    };        
    var index = i * moveL;
    $("#index_news ol").animate({left:-index+"px"},500);
  });
};


//评价星星效果
function reviewsBox(boxid,_name,_hover){
  var _box = $(boxid);
  var _arr = _box.find(_name);
  var _index = 0;
  var _now = _box.find("."+_hover).length;
  
  var _checkNow = function(_num){
    _arr.removeClass(_hover);
      for(var i=0;i<=_num;i++){
        _arr.eq(i).addClass(_hover);
        }
    };//fun END
    
  // hover效果
  _arr.hover(function(){
    _index = $(this).index();
    _checkNow(_index);
    },function(){
      _checkNow(_now-1);
  });

  // 点击效果
  _arr.click(function(){
        _now = $(this).index();
        for(var i=0;i<=_now;i++){
        _arr.eq(i).addClass(_hover);
        }
      _now += 1;
    });
};


// 苹果开关按钮 
function appleOnoff () {
  $(".open2").click(function(){
    if($(this).attr("class")=="open2")
    {
    $(this).removeClass();
    $(this).parent().removeClass();
    $(this).addClass("close2");
    $(this).parent().addClass("close1");
    }
    else
    {
      $(this).parent().removeClass();
      $(this).removeClass();
      $(this).parent().addClass("open1");
    $(this).addClass("open2");
    }
  });
};


