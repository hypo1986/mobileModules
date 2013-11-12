/**
 * 注册页交互
 * User: qisx
 * Date: 13-7-25
 * Time: 下午4:14
 */
(function($,root){
    var XK=root.XK,
        util=XK.util;
    var rootUrl = "../../..";   //请求地址前缀
    //各输入框的验证规则
    var regexAccount = new RegExp(/^[a-zA-Z][a-zA-Z\d_]{5,19}$/),
        //regexFullName = new RegExp(/^[\u4e00-\u9fa5\w-.]{1,50}$/),
        regexMobile = new RegExp(/^1[\d]{10,10}$/),
        regexEMail = new RegExp(/^[\u4e00-\u9fa5\w]+([-+.][\u4e00-\u9fa5\w]+)*@[\u4e00-\u9fa5\w]+([-.][\u4e00-\u9fa5\w]+)*\.[\u4e00-\u9fa5\w]+([-.][\u4e00-\u9fa5\w]+)*$/),
        regexPassword = new RegExp(/^[a-zA-Z\d]{6,20}$/),
        regexEnterpriseName = new RegExp(/^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]{1,50}$/);
    $(function(){
        var code,   //调用获取验证码接口返回的code信息
            launchedData,   //保存开通后返回的信息
            captchaImgKey; //图形验证码key
        //注册section view
        util.regView(['user-reg-tpl','user-reg-info-tpl','user-reg-success-tpl'],'reg');

        //输入验证码
        (function(){
            var sectionEl=$('#user-reg-tpl'),
                captchaImgEl=$('.captcha-img',sectionEl),
                getCaptchaBtnEl=$('.get-captcha-btn',sectionEl),    //获取验证码按钮
                subCaptchaBtnEl=$('.submit-captcha-btn',sectionEl); //提交验证码按钮
            /**
             * 设置验证码等待提示
             */
            var waitCaptcha=function(){
                var maxTime=60,
                    i=maxTime;
                clearInterval(waitCaptcha.tid);
                getCaptchaBtnEl.prop('disabled',true).addClass('btn-state-disabled').text(maxTime+'秒后可重新获取验证码');
                waitCaptcha.tid=setInterval(function(){
                    if(i==0){
                        clearInterval(waitCaptcha.tid);
                        getCaptchaBtnEl.prop('disabled',false).removeClass('btn-state-disabled').text('获取短信验证码');
                    }else{
                        i--;
                        getCaptchaBtnEl.text(i+'秒后可重新获取验证码');
                    }
                },1000);
            };
            /**
             * 更换图形验证码
             */
            var updateCaptchaImg=function(){
                var now=new Date();
                captchaImgKey=Math.ceil(now.getTime()/1000);
                captchaImgEl.attr('src',rootUrl + '/WebReg/GetCodeImg?key='+captchaImgKey);
            };
            //更换图形验证码
            sectionEl.on('click','.change-captcha-l,.captcha-img',function(evt){
                updateCaptchaImg();
                evt.preventDefault();
            });
            updateCaptchaImg();   //初次打开更换验证码

            //获取验证码
            sectionEl.on('click','.get-captcha-btn',function(){
                var mobileCodeEl=$('.mobile-code',sectionEl),
                    mobileCode= $.trim(mobileCodeEl.val()),
                    captchaImgInputEl=$('.ident-code',sectionEl),
                    captchaImgVal=$.trim(captchaImgInputEl.val());
                if($(this).hasClass('btn-state-disabled')){
                    return;
                }
                mobileCodeEl.removeClass('reg-inp-fail');
                if (!regexMobile.test(mobileCode)&&!regexEMail.test(mobileCode)){  //验证手机号和邮箱
                    util.alert('请输入有效的手机号码或邮箱');
                    mobileCodeEl.addClass('reg-inp-fail');
                    return;
                }
                captchaImgInputEl.removeClass('reg-inp-fail');
                if (captchaImgVal.length==0) {
                    util.alert('请输入图形验证码');
                    captchaImgInputEl.addClass('reg-inp-fail');
                    return;
                }
                util.ajax({
                    //url: rootUrl + '/WebReg/BuildValidateCode2',
                    //url: 'http://192.168.0.9/',
                    url: '../data/success.json',
                    data: {
                        mobileOrEMail: mobileCode,
                        code:captchaImgVal,
                        key:captchaImgKey
                    },
                    "type":"post",
                    //timeout:1000,
                    error:function(){
                        //util.alert("网络不畅通，请稍候点击重试");
                    },
                    success: function(responseData){
                        var errorMsg;
                        if (responseData.success) {
                            code=responseData.code; //设置返回code信息
                            subCaptchaBtnEl.removeClass('btn-state-disabled').prop('disabled',false);
                            waitCaptcha();
                        }else {
                            switch (responseData.error) {
                                case '001':
                                    errorMsg = "请输入有效的手机号码";
                                    break;
                                case '002':
                                    errorMsg= "发送验证码失败";
                                    break;
                                case '003':
                                    errorMsg= "已重复注册5个，不可再注册";
                                    break;
                                case '004':
                                    errorMsg = "两次获取验证码的间隔不能少于1分钟";
                                    break;
                                default:
                                    errorMsg= responseData.error;
                                    break;
                            }
                            util.alert(errorMsg);
                        }
                    }
                },{
                    "tryTimes":4,    //请求失败再请求4次
                    "finallyError":function(){
                        util.alert("网络不畅通，请稍候点击重试");
                    }
                });
            });
            //提交验证码
            sectionEl.on('click','.submit-captcha-btn',function(){
                var mobileCodeEl= $('.mobile-code',sectionEl),
                    captchaCodeEl=$('.captcha-code',sectionEl);
                var mobileCode= $.trim(mobileCodeEl.val()),
                    captchaCode= $.trim(captchaCodeEl.val());
                if($(this).hasClass('btn-state-disabled')){
                    return;
                }
                mobileCodeEl.removeClass('reg-inp-fail');
                captchaCodeEl.removeClass('reg-inp-fail');

                if (!regexMobile.test(mobileCode)&&!regexEMail.test(mobileCode)) {  //验证手机号和邮箱
                    util.alert('请输入有效的手机号码或邮箱');
                    mobileCodeEl.addClass('reg-inp-fail');
                    return;
                }
                if(captchaCode.length==0){
                    util.alert('请输入验证码');
                    captchaCodeEl.addClass('reg-inp-fail');
                    return;
                }
                util.ajax({
                    //url: rootUrl + '/WebReg/ValidateCodeAndMobile',
                    //url: 'http://192.168.0.9/',
                    url: '../data/success.json',
                    data: {
                        mobileOrEMail: mobileCode,
                        code: captchaCode
                    },
                    "type":"post",
                    //timeout:1000,
                    success: function(responseData){
                        var errorMsg;
                        if (responseData.success) {
                            //跳转到填写详细信息区
                            util.navToView('user-reg-info-tpl','reg');
                        }else {
                            errorMsg="验证码不正确";
                            util.alert(errorMsg);
                        }
                    }
                },{
                    "tryTimes":4,    //请求失败再请求4次
                    "finallyError":function(){
                        util.alert("网络不畅通，请稍候点击重试");
                    }
                });
            });
        }());

        //输入帐号信息
        (function(){
            var sectionEl=$('#user-reg-info-tpl'),
                nameEl=$('.field-name',sectionEl),  //企业名
                accountEl=$('.field-account',sectionEl),    //企业帐号
                emailEl=$('.field-email',sectionEl),    //邮箱
                couponEl=$('.field-coupon',sectionEl),  //优惠码
                submitEl=$('.sub-info-btn',sectionEl),  //提交按钮
                mobileCodeEl=$('#user-reg-tpl .mobile-code'),   //手机号
                captchaCodeEl=$('#user-reg-tpl .captcha-code'); //验证码
            var pwd = String(Math.random()).substr(2,6);
            var isLaunched=function(requestData,sucessCb){
                util.ajax({
                    "type":"post",
                    //"url":rootUrl + '/WebReg/IsLaunched',
                    url: '../data/success.json',
                    "data":requestData,
                    "success":sucessCb
                });
            };
            //提交动作
            sectionEl.on('click','.sub-info-btn',function(){
                var name=$.trim(nameEl.val()),
                    account= $.trim(accountEl.val()),
                    //email= $.trim(emailEl.val()),
                    coupon= $.trim(couponEl.val()),
                    mobileCode=$.trim(mobileCodeEl.val()),
                    captchaCode= $.trim(captchaCodeEl.val());

                nameEl.removeClass('reg-inp-fail');
                accountEl.removeClass('reg-inp-fail');
                //emailEl.removeClass('reg-inp-fail');

                if(name.length==0){
                    util.alert("企业名称不能为空");
                    nameEl.addClass('reg-inp-fail');
                    return;
                }
                if(name.length>50){
                    util.alert("企业名称输入最多为50个字符");
                    nameEl.addClass('reg-inp-fail');
                    return;
                }
                if (!regexEnterpriseName.test(name)) {
                    util.alert("请输入正确格式，可包括汉字、字母、数字和下划线");
                    nameEl.addClass('reg-inp-fail');
                    return;
                }
                if(account.length==0){
                    util.alert("企业帐号不能为空");
                    nameEl.addClass('reg-inp-fail');
                    return;
                }
                if(!/[A-Za-z]/.test(account.slice(0,1))){
                    util.alert("企业帐号需以字母开头");
                    accountEl.addClass('reg-inp-fail');
                    return;
                }
                if(account.length<6||account.length>20){
                    util.alert("企业帐号为6-20个字符");
                    accountEl.addClass('reg-inp-fail');
                    return;
                }
                if (!regexAccount.test(account)) {
                    util.alert("请输入正确格式，可包括汉字、字母、数字和下划线");
                    accountEl.addClass('reg-inp-fail');
                    return;
                }
                /*if(email.length==0){
                    util.alert("邮箱地址不能为空");
                    nameEl.addClass('reg-inp-fail');
                    return;
                }
                if (!regexEMail.test(email)) {
                    util.alert("您输入的邮箱格式有误，请重新输入");
                    emailEl.addClass('reg-inp-fail');
                    return;
                }*/
                util.ajax({
                    //url: rootUrl + '/WebReg/Register2',
                    //url: 'http://192.168.0.9/',
                    url: '../data/success.json',
                    data: {
                        RegistrationID: null,
                        EnterpriseName: name,
                        EnterpriseAccount: account,
                        ManagerFullName: mobileCode,
                        ManagerPassword: pwd,
                        //ManagerMobileOrEMail: mobileCode+','+email,
                        ManagerMobileOrEMail: mobileCode,
                        VendorID: coupon,
                        Province: '',
                        ValidateCode: captchaCode,
                        Code: code,
                        Source: 1,
                        SourceUserID: '',
                        ProductID: '',
                        Deadline: '',
                        ValidateUrl: 'blank.html'   //占位用
                    },
                    "type":"post",
                    //timeout:1000,
                    success: function(responseData){
                        var errorMsg,
                            regReturnCode;
                        if (responseData.success) {
                            regReturnCode=decodeURIComponent(responseData.data.substr(responseData.data.indexOf("code=") + 5));
                            //发请求，开通
                            util.ajax({
                                "type":"post",
                                //"url":rootUrl + '/WebReg/Launch',
                                url: '../data/success.json',
                                "data":{
                                    "code": regReturnCode
                                },
                                "success":function(responseData){
                                    var errorMsg;
                                    //检测launch成功后回调
                                    var launchSuccessCb=function(){
                                        //导航到注册成功提示页
                                        //回填登录信息
                                        util.externalExecute("SetLoginInfo",launchedData.enterpriseAccount+','+launchedData.employeeAccount+','+pwd);
                                        //设置企业帐号，个人帐号，登录密码
                                        $('#user-reg-success-tpl .enterprise-account').text(launchedData.enterpriseAccount);
                                        $('#user-reg-success-tpl .employee-account').text(launchedData.employeeAccount);
                                        $('#user-reg-success-tpl .login-pwd').text(pwd);
                                        util.navToView('user-reg-success-tpl','reg');
                                        return;
                                    };
                                    if (responseData.success) {
                                        launchedData= responseData.data;
                                        //pi.data = result.data.enterpriseName + "|" + result.data.enterpriseAccount + "|" + result.data.employeeAccount;
                                        //检查是否开通成功
                                        isLaunched({
                                            "code":regReturnCode
                                        },function(responseData){
                                            var tryTimeIndex=0;
                                            if(responseData.success){
                                                launchSuccessCb();
                                                return;
                                            }else{
                                                setTimeout(function(){
                                                    var _self=arguments.callee;
                                                    isLaunched({
                                                        "code":regReturnCode
                                                    },function(responseData){
                                                        if(responseData.success){
                                                            launchSuccessCb();
                                                            return;
                                                        }
                                                        if(tryTimeIndex>60){   //3分钟
                                                            //提示参数错误
                                                            util.alert("参数错误/" + responseData.error);
                                                            return;
                                                        }
                                                        /*if(responseData.error){
                                                            //提示参数错误
                                                            util.alert("参数错误/" + responseData.error);
                                                            return;
                                                        }*/
                                                        tryTimeIndex++;
                                                        //延时3s后再检测一次
                                                        _self();
                                                    });
                                                },3000);    //延时3s后查询一次
                                            }
                                        });


                                    } else {
                                        switch (responseData.error) {
                                            case '001':
                                                errorMsg = "部门太多了";
                                                break;
                                            case '002':
                                                errorMsg= "员工太多了";
                                                break;
                                            case '003':
                                                errorMsg= "员工信息不完整（缺少FullName或MobileOrEMail）";
                                                break;
                                            case '004':
                                                errorMsg= "手机号码或邮箱地址不正确";
                                                break;
                                            case '005':
                                                errorMsg= "找不到待开通的注册信息";
                                                break;
                                            case '101':
                                                errorMsg= "企业名称已存在";
                                                break;
                                            case '102':
                                                errorMsg= "企业帐号已存在";
                                                break;
                                            case '103':
                                                errorMsg = "优惠码无效";
                                                break;
                                            case '104':
                                                errorMsg = "产品无效";
                                                break;
                                            default:
                                                errorMsg= responseData.error;
                                                break;
                                        }
                                        util.alert(errorMsg);
                                        util.hideGlobalLoading();
                                    }
                                }
                            },{
                                "keepLoading":true  //保持loading遮罩
                            });
                            //回填企业号和个人帐号
                            //调到注册功能提示页
                            //util.navToView('user-reg-success-tpl','reg');
                        }else {
                            switch (responseData.error) {
                                case "000":
                                    errorMsg = "请输入有效的短信验证码";
                                    break;
                                case "001":
                                    errorMsg= "请输入企业或团队名称";
                                    break;
                                case "002":
                                    errorMsg = "请输入有效的企业或团队帐号";
                                    break;
                                case "003":
                                    errorMsg= "请填写姓名，不可含有空白@等字符";
                                    break;
                                case "005":
                                    errorMsg= "请输入有效的手机号码和电子邮箱";
                                    break;
                                case "100":
                                    errorMsg= "该手机号码已注册过";
                                    break;
                                case "101":
                                    errorMsg = "该企业或团队名称已注册过";
                                    break;
                                case "102":
                                    errorMsg = "该企业或团队帐号已注册过";
                                    break;
                                case "103":
                                    errorMsg= "优惠码无效";
                                    break;
                                case "104":
                                    errorMsg= "产品无效";
                                    break;
                                default:
                                    errorMsg= responseData.error;
                                    break;
                            }
                            util.alert(errorMsg);
                            util.hideGlobalLoading();
                        }
                    }
                },{
                    "tryTimes":4,    //请求失败再请求4次
                    "finallyError":function(){
                        util.alert("网络不畅通，请稍候点击重试");
                    },
                    "keepLoading":true  //保持loading遮罩
                });
            });
        }());
        //立即登录
        (function(){
            var sectionEl=$('#user-reg-success-tpl');
            sectionEl.on('click','.login-btn',function(){
                //回调登录信息
                //util.externalExecute("SetEnterpriseAccount",launchedData.enterpriseAccount);
                //util.externalExecute("SetPersonalAccount",launchedData.employeeAccount);    //设置个人帐户后会手机端会跳到登录页
                //关闭弹框
                util.externalExecute("CloseWindow");
            });
        }());
        //点击电话号码取消默认行为
        (function(){
            var mobileLinkEl=$('.mobile-link');
            mobileLinkEl.click(function(evt){
                var linkEl=$(this);
                var sysName=util.sysDetector();
                var mobileNumber=linkEl.attr('href').slice('4');
                if(sysName=="android"){
                    util.externalExecute("CallMobile",mobileNumber);    //android需要调用external方法
                    evt.preventDefault();
                }
            });
        }());
        //注册CloseWindow拦截函数
        //处于输入帐号信息的view下需要提示是否关闭
        util.regInterceptor('IsCancelWindowClose',function(){
           // util.alert('start');
            var sectionEl=$('#user-reg-info-tpl');
            if(sectionEl.hasClass('tpl-state-active')){
                if(util.confirm("注册尚未完成，是否退出？")){
                    util.externalExecute("CloseWindow");
                }
                return false;
            }else{
                return true;
            }
        });
        //帮助弹框
        (function(){
            var helpNocode=$('#help-nocode');
            helpNocode.click(function(){
                $('#reg-help-apv-tpl').show();
            });
            $('#reg-help-apv-tpl').find('.help-apv-close').click(function(){
                $('#reg-help-apv-tpl').hide();
            });
			
			var helpEmailNocode=$('#helpemail-nocode');
            helpEmailNocode.click(function(){
                $('#reg-helpemail-apv-tpl').show();
            });
            $('#reg-helpemail-apv-tpl').find('.help-apv-close').click(function(){
                $('#reg-helpemail-apv-tpl').hide();
            });
			
			//$('#reg-invite-apv-tpl').find('.help-apv-close').click(function(){
               // $('#reg-invite-apv-tpl').hide();
            //});

            var infoNocode=$('#info-nocode');
            infoNocode.click(function(){
                $('#reg-info-apv-tpl').show();
            });
            $('#reg-info-apv-tpl').find('.help-apv-close').click(function(){
                $('#reg-info-apv-tpl').hide();
            });
        }());
    });
}(Zepto,window));
