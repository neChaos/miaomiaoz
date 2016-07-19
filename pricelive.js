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

				var upDate = data.prod_pricecut_date.slice(8,10);

				var len=data.data.pcinfo.info.length;

				//获取最近降价点
				for(var i=1;i<=len;i++){

					if(data.data.pcinfo.info[len-i].dt.slice(8,10)==upDate){

						data.data.pcinfo.ed=data.data.pcinfo.info[len-i].dt;

						data.data.pcinfo.info[len-i].pr=data.prod_price;

						data.data.pcinfo.info.splice(len-i+1);

						break;

					}
				}

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

		this.getTimeLag=function(t){
			
				var time = (new Date(t.replace(/-/g,'/'))).getTime() / 1000;
				var date = new Date(serviceTime);
				var now = date.getTime() / 1000;
				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var day = date.getDate();
				var today = (new Date(year + '/'+month + '/' + day)).getTime() / 1000;
				var t = 0;
				var timeStr = '';
				if(time >= today ){//今天
					t = now - time;
					if(t>0 && t<60){ //小于1分钟
						timeStr = t + '秒前';
					}else if(t>=60 && t<60*60){//大于等于1分钟，小于1小时
						timeStr = Math.floor(t/60) + '分钟前';
					}else if(t>=60*60 && t<60*60*24){//大于等于1小时，小于1天
						var h = Math.floor(t/(60*60)); 
						//var m = Math.floor((t - h*60*60)/60);
						//m = m < 10 ? '0' + m : m;
						//timeStr = h + ':'+m;
						timeStr = h + '小时前';
					}else{
						timeStr = '刚刚';
					}
				}else{
					t = Math.floor((today - time) / 86400);
					switch(t){
						case 0 :
							timeStr = '昨天';
							break;
						case 1 :
							timeStr = '前天';
							break;
						default :
							timeStr = '3天前';
					}
				}
				return timeStr;
			}

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

