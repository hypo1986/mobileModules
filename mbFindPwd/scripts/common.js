/**
 * 基于jQuery和underscore的公用文件
 * User: qisx
 * Date: 13-7-25
 * Time: 下午4:14
 */

(function($,root){
    var XK={},
        util={},
        viewStore={};
    XK.EMPTY_FN=function(){};   //空函数
    _.extend(util,{
        /**
         * 注册View，每个view都可以认为是单独一页，默认存在在default空间下
         */
        "regView":function(ids,pageKey){
            ids=[].concat(ids);
            pageKey=pageKey||"default";
            viewStore[pageKey]=ids;
        },
        /**
         * 导航到指定的view
         * @param id
         * @param pageKey
         */
        "navToView":function(id,pageKey){
            var viewIds;
            pageKey=pageKey||"default";
            viewIds=viewStore[pageKey];
            //先隐藏全部view，再显示当前view
            _.each(viewIds,function(viewId){
                $('#'+viewId).removeClass('tpl-state-active');
            });
            $('#'+id).addClass('tpl-state-active');
            //scroll导航顶部
            root.document.documentElement.scrollTop=0;
        },
        /**
         * ajax包装
         */
        "ajax":function(opts,cusOpts){
            var xhr,
                error,
                beforeSend,
                complete,
                executeFn,
                tryIndex=0;
            var globalLoadingEl=$('#global-loading');
            if(globalLoadingEl.length==0){
                globalLoadingEl=$('<div id="global-loading"></div>');
                globalLoadingEl.appendTo('body');
            }

            opts= _.extend({
                "type":"get",
                "dataType":"json",
                "cache": false,
                "timeout":60000 //默认设置1m钟超时
            },opts||{});
            cusOpts= _.extend({
                "tryTimes":0,    //失败后尝试执行次数
                "finallyError":XK.EMPTY_FN,
                "keepLoading":false //是否保持loading遮罩
            },cusOpts||{});
            error=opts.error;
            opts.error=function(){
                if(tryIndex<cusOpts.tryTimes){
                    executeFn();
                    tryIndex++;
                }else{
                    cusOpts.finallyError.apply(this,arguments);
                }
                return error&&error.apply(this,arguments);
            };
            beforeSend=opts.beforeSend;
            opts.beforeSend=function(){
                globalLoadingEl.show();
                return beforeSend&&beforeSend.apply(this,arguments);
            };
            complete=opts.complete;
            opts.complete=function(){
                if(!cusOpts.keepLoading){
                    globalLoadingEl.hide();
                }
                return complete&&complete.apply(this,arguments);
            };
            executeFn=function(){
                xhr=$.ajax(opts);
                return xhr;
            };
            return executeFn();
        },
        /**
         * 系统检测
         */
        "sysDetector":function(){
            if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
                return "ios";
            } else if (/(Android)/i.test(navigator.userAgent)) {
                return "android";
            }else{
                return "unknown";
            }
        },
        "alert":function(message){
            var sysName=util.sysDetector(),
                ifrEl=$('#ios-show-tip'),
                ifrDom;
            if (sysName=="ios") {
                if(ifrEl.length==0){
                    ifrEl=$('<iframe id="ios-show-tip" src="data:text/plain" />');
                    ifrEl.hide();
                    ifrEl.appendTo('body');
                }
                ifrDom=ifrEl.get(0);
                return ifrDom.contentWindow.alert(message);
                //return alert(message);
            } else if (sysName=="android") {
                //return external.alert(message);
                return alert(message);
            }else{
                try{
                    return alert(message);
                }catch(e){
                    return "未知系统不能执行";
                }
            }
        },
        "confirm":function(message){
            var sysName=util.sysDetector(),
                ifrEl=$('#ios-show-tip'),
                ifrDom;
            if (sysName=="ios") {
                if(ifrEl.length==0){
                    ifrEl=$('<iframe id="ios-show-tip" src="data:text/plain" />');
                    ifrEl.hide();
                    ifrEl.appendTo('body');
                }
                ifrDom=ifrEl.get(0);
                return ifrDom.contentWindow.confirm(message);
                //return confirm(message);
            } else if (sysName=="android") {
                //return external.confirm(message);
                return confirm(message);
            }else{
                try{
                    return confirm(message);
                }catch(e){
                    return "未知系统不能执行";
                }
            }
        },
        /**
         * external调用者
         * @param cmdName
         * @param params
         * @returns {*}
         */
        "externalExecute":function(cmdName,params){
            var ifrEl,
                sysName;
            params=params||"";
            sysName=util.sysDetector();
            if (sysName=="ios") {
                ifrEl=$('#for-ios-exe');
                if(ifrEl.length==0){
                    ifrEl=$('<iframe src="facishare://'+cmdName+':'+params+'" id="for-ios-exe" />');
                    ifrEl.wrap('<div class="for-ios-exe-wrapper" style="display: none"></div>').closest('.for-ios-exe-wrapper').appendTo('body');
                }else{
                    ifrEl.attr('src','facishare://'+cmdName+':'+params);
                }
                return;
            } else if (sysName=="android") {
                return external[cmdName](params);
            }else{
                return "未知系统不能执行";
            }
        },
        /**
         * external拦截器
         * @param interceptorName
         * @param executor
         */
        "regInterceptor":function(interceptorName,executor){
            var sysName=util.sysDetector();
            if (sysName=="ios") {
                window[interceptorName]=executor;
            } else if (sysName=="android"||sysName=="unknown") {
                //external.regInterceptor(interceptorName+'-'+executor());
                //util.alert(interceptorName+" init");
                window[interceptorName]=function(){
                    //util.alert("IsCancelWindowClose called");
                    //executor();
                    //util.alert("end");
                    try{
                        //util.alert("executeInterceptor start");
                        external.executeInterceptor(interceptorName,executor());
                        //util.alert("executeInterceptor end");
                    }catch(e){
                        util.alert(e.message);
                    }
                };
                //硬编码写死调用IsCancelWindowClose,不需要注册
                //external.regInterceptor(interceptorName);
            }else{
                return "未知系统不能执行";
            }
        },
        "showGlobalLoading":function(){
            var globalLoadingEl=$('#global-loading');
            globalLoadingEl.show();
        },
        "hideGlobalLoading":function(){
            var globalLoadingEl=$('#global-loading');
            globalLoadingEl.hide();
        }
    });
    _.extend(XK,{
        "util":util
    });
    root.XK=XK;
}(jQuery,window));


