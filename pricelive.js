(function(){
	var PublicObj = function(){

		// 设置一个对象为了去重
		this.goodsN = {};

		this.jumpUrl  =  "http://www.henzanapp.com/jump/?";

		// a记录下拉是否加载好新一批货物，x纪录上一次加载货物的位置
		this.getDataStatus = {
			a:true,
			x:0,
			y:10
		};	
		this.mall = {

				3 : '京东',
				17532 : '苏宁',
				81 : '当当',
				4 : '亚马逊',
				133 : '一号店',
				17533 : '国美',
				138 : '银泰'

		};

		this.setHtml = function (data) {

			var url = this.jumpUrl+"gid="+data.prod_id+"&amp;"+"url="+data.prod_url;

			var html='<li class="item" data-ut="'+data.update_time+'">\
			  <a class="link"  href="'+url+'" target="_blank">\
			  <div class="pic">\
			  <div class="wrapper"><img qid="'+data.id+'" src="'+data.prod_pic+'"></div></div>\
				  <div class="list">\
			  <p class="status">\
				  <span class="partner">'+this.mall[data.shop_id]+'</span>\
				  <span class="time">'+this.getTimeLag(data.update_time)+'</span>\
			  </p>\
			  <p class="name">'+data.prod_name+'</p>\
			  <p class="desc">'+data.prod_price_txt1+'</p>\
			  <div class="price">'+data.prod_price_txt2+'<span class="btn" id='+data.id+'>价格走势</span></div></div></a>\
			  <div class="pricetrend hidden" id="pricetrend'+data.id+'"></div></li>';

			  $(".article-list").append(html);  

	  		this.loadPricetrend(data.data,data);


			  $('#pricetrend'+data.id).hide();

			this.getNewGoodsNumber();

			$('.more_load').text('正在加载...');

		};

		//获取10个商品

		this.getData = function(){

			var that = this;

			$.ajax("/api/pricelive_list?offset="+this.getDataStatus.x+"&limit="+this.getDataStatus.y).done(function(json){

				that.getDataStatus.x+=10;

				var newArr = [];

				for(var m=0;m<=json.length-1;m++){

					// 检测是否重复，是否有图片，是否有价格数据，名字是不是小于10
					if(that.goodsN[json[m].id]==undefined&&json[m].prod_pic.slice(0,4)=="http"&&json[m].data&&json[m].prod_name.length>=10){

						that.setHtml(json[m]);

						that.goodsN[json[m].id]=true;

					}
			
				}

				that.getDataStatus.a=true;

			}).fail(
				function(){
					// 如果没有货物加载失败
					$('.more_load').text("没有更多商品");
				}
			);

		};

		// 获取商品更新价格时间间隔

		this.getTimeLag=function(time){

			// 获取商品更新时间

			var time1 = new Date(time.replace(/-/g,"/")).getTime()/1000;

			// 获取系统时间

			var time2 = serviceTime/1000;

			var time3 = time2 - time1;

			if(time3>=86400){

				var d = Math.floor(time3/86400);

				if(d<2&&d>=1){

					return "昨天";

				}else if(d>=2&& d<3){

					return "前天";

				} else {

					return d+"天前";

				}
			} else if(time3>=3600){

				return Math.floor(time3/3600)+"小时前";

			} else if(time3>=60){

				return Math.floor(time3/60) +"分钟前";

			}else if(time3<60&&time3>0){

				return Math.floor(time3)+"秒前";
			}else{
				// 假如出错返回空字符串
				return "";

			}

		};

		// 画trend图

		this.loadPricetrend = function(option,dd){

			var options = {
				pcinfo : '',
				wrap : '#pricetrend',
				confObj : {
					haveCoordinate:true,
					haveMover : true,
					showLastPoint : true,
					showLowestPoint :false
				}
			}
			$.extend(true,options,option);

			if(!options.pcinfo) return false;

			var placeholder = $(options.wrap+dd.id);

			placeholder.html('');

			placeholder.append('\
				<div class="chrome-price gwd_toolbar_assist_popbox">\
				<div class="content-pane">\
				<div class="chart placeholder"></div>\
				<div class="rightWord">\
				<div class="high">\
				<div>最高价</div>\
				<div id="lastHeight"></div>\
				</div>\
				<div class="low">\
				<div>最低价</div>\
				<div id="lastLow"></div>\
				</div>\
				</div>\
				</div>\
				</div>');

			var histPriceDrawer = new HistPriceDrawer();
			var drawtarget = placeholder.find('.placeholder');
			histPriceDrawer.addData(options.pcinfo,drawtarget);
			histPriceDrawer.draw(drawtarget,options.confObj);
		};

		// 点击降价直播按钮展示降价曲线
		this.showTrend = function(event){


			if(event.target.nodeName=='SPAN'){

				$('#pricetrend'+event.target.id).slideToggle(200);

				if(parseInt($(this).css('padding-left'))<20){

					$(this).css("padding","0 23px")

					$(this).text("收起");

				}else{

					$(this).css("padding","0 10px")

					$(this).text("价格走势");
				}
							
			}
			// 防止按btn键 跳转链接
			return false;

		};
		// 跳转链接

		//加载新产品

		this.addNewGoods=function (ob){


			if($(window).scrollTop()>144){

				$(".backTop").css("visibility",'visible');

			}else{

				$(".backTop").css("visibility",'hidden');

			};

			if(!ob.getDataStatus.a){
				return;
			}
			// 获取手机网页的可视高度
			var viewHeight=$('html').width()*1.8;

			if($('html').height()-$(window).scrollTop()<=viewHeight){
				ob.getDataStatus.a=false;
				ob.getData();
			}



		}

		this.getNewGoodsNumber=function(){

			// 取出最新一条数据的时间

			var now = new Date($(".item:eq(0)").data('ut').replace(/-/g,"/")).getTime();

			$.ajax("/api/pricelive_count?ts="+now).done(function(json){

				if(json.count>0){

					$(".refresh").css({'display':'block'});

				}

				$(".refresh span").text(json.count);

			}).fail(
				function(){

					$(".refresh>a").text("加载错误请稍等..");

				}
			);
		};


	};
	$(document).ready(function(){

		var obj = new PublicObj();
			// 获取第一批数据
			obj.getData();

		$('.article-list').on('click','.btn',obj.showTrend);

		// 滚动判定是否到达底部加载新页面
		$(window).on('scroll',function(){
			obj.addNewGoods(obj);
		});

		// 点击返回top
		$('body').on('click','.backTop',function(){
				$(window).scrollTop(0);
		});
		// 点击刷新页面
		$('.refresh>a').on('click',function(){
			window.location.reload()	
		})
		// 每隔两分钟检测是否有新货物
		setInterval(obj.getNewGoodsNumber,120000);

	});
})();

