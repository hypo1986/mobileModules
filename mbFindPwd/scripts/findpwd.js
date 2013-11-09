/**
 * 找回密码交互
 * User: qisx
 * Date: 13-7-31
 * Time: 下午12:48
 */
(function($,root){
    var XK=root.XK,
        util=XK.util;
    var rootUrl = "../../..";   //请求地址前缀
    //var rootUrl = "../../../..";   //请求地址前缀
    //各输入框的验证规则
    var regexAccount = new RegExp(/^[a-zA-Z][a-zA-Z\d_]{5,19}$/),
    //regexFullName = new RegExp(/^[\u4e00-\u9fa5\w-.]{1,50}$/),
        regexMobile = new RegExp(/^1[\d]{10,10}$/),
        regexEMail = new RegExp(/^[\u4e00-\u9fa5\w]+([-+.][\u4e00-\u9fa5\w]+)*@[\u4e00-\u9fa5\w]+([-.][\u4e00-\u9fa5\w]+)*\.[\u4e00-\u9fa5\w]+([-.][\u4e00-\u9fa5\w]+)*$/),
        regexPassword = new RegExp(/^[a-zA-Z\d]{6,20}$/),
        regexEnterpriseName = new RegExp(/^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]{1,50}$/);
    $(function(){
        var code,   //调用获取验证码接口返回的code信息
            enterpriseStore;   //企业列表数据存储
        //注册section view
        util.regView(['user-findpwd-tpl','findpwd-choseuser-tpl','findpwd-again-tpl'],'findpwd');

        /**
         * 渲染帐号信息
         */
        var renderEmployeeAccounts=function(listData){
            var sectionEl=$('#findpwd-choseuser-tpl'),
                listEl=$('.employee-list',sectionEl);
            var htmlStr="";
            _.each(listData,function(employeeData){
                var isStopHtmlStr='';
                if(employeeData.isStop){    //已停用
                    isStopHtmlStr='<span class="fpwt-name-apv color-grey">已停用</span>';
                }else{
                    isStopHtmlStr='<a href="javascript:;" class="reset-pwd-l fda-blue">重置密码</a>';
                }
				var isAdminHtmlStr='';
                if(employeeData.isAdmin){    //是否是管理员
                    isAdminHtmlStr='<span class="fpwt-name-apv color-grey">（管理员）</span>';
                }else{
                    isAdminHtmlStr='';
                }
                htmlStr+='<tr class="employee-item" enterpriseaccount="'+employeeData.enterpriseAccount+'">'+
                    '<td><div>'+employeeData.enterpriseAccount+'</div></td>'+
                '<td><div>'+employeeData.enterpriseName+'</div></td>'+
                    '<td><div>'+employeeData.employeeAccount+'</div></td>'+
                '<td><div>'+employeeData.employeeName+isAdminHtmlStr+'</div></td>'+
                    '<td><div>'+isStopHtmlStr+'</div></td>'+
                '</tr>';
            });
            if(listData.length>0){
                listEl.html(htmlStr);
            }else{
                listEl.html('<tr class="empty-tip"><td colspan="5"><p>此手机号或邮箱未绑定帐号，请确认后重试。</p><p class="prev-step-wrapper"><a href="#" class="prev-step-l">上一步</a></p></td></tr>');
            }
        };
        /**
         * 通过enterpriseAccount获取企业帐号列表信息
         * @param enterpriseAccount
         */
        var getEnterpriseData=function(enterpriseAccount){
            return _.find(enterpriseStore,function(itemData){
                return itemData.enterpriseAccount==enterpriseAccount;
            });
        };
        //输入验证码
        (function(){
            var sectionEl=$('#user-findpwd-tpl'),
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
                        getCaptchaBtnEl.prop('disabled',false).removeClass('btn-state-disabled').text('获取验证码');
                    }else{
                        i--;
                        getCaptchaBtnEl.text(i+'秒后可重新获取验证码');
                    }
                },1000);
            };
            //获取验证码
            sectionEl.on('click','.get-captcha-btn',function(){
                var mobileCodeEl=$('.mobile-code',sectionEl),
                    mobileCode= $.trim(mobileCodeEl.val());
                if($(this).hasClass('btn-state-disabled')){
                    return;
                }
                mobileCodeEl.removeClass('reg-inp-fail');
                if (!(regexMobile.test(mobileCode)||regexEMail.test(mobileCode))) {
                    util.alert('请输入有效的手机号码或邮箱地址');
                    mobileCodeEl.addClass('reg-inp-fail');
                    return;
                }
                util.ajax({
                    url: rootUrl + '/WebReg/BuildValidateCodeForResetPassword',
                    //url: 'http://192.168.0.9/',
                    //url: '../publish/data/success.json',
                    data: {
                        mobileOrEMail: mobileCode
                    },
                    "type":"get",
                    //timeout:1000,
                    error:function(){
                        //util.alert("网络不畅通，请稍候点击重试");
                    },
                    success: function(responseData){
                        var errorMsg;
                        if (responseData.success) {
                            //code=responseData.code; //设置返回code信息
                            subCaptchaBtnEl.removeClass('btn-state-disabled').prop('disabled',false);
                            waitCaptcha();
                        }else {
                            switch (responseData.error) {
                                case '001':
                                    errorMsg = "手机或邮箱格式不正确";
                                    break;
                                case '002':
                                    errorMsg= "两次获取验证码的间隔不能少于1分钟";
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

                if (!(regexMobile.test(mobileCode)||regexEMail.test(mobileCode))) {
                    util.alert('请输入有效的手机号码或邮箱地址');
                    mobileCodeEl.addClass('reg-inp-fail');
                    return;
                }
                if(captchaCode.length==0){
                    util.alert('请输入验证码');
                    captchaCodeEl.addClass('reg-inp-fail');
                    return;
                }
                util.ajax({
                    url: rootUrl + '/WebReg/GetAllEmployeeAccounts',
                    //url: 'http://192.168.0.9/',
                    //url: '../publish/data/employee-list.json',
                    data: {
                        mobileOrEMail: mobileCode,
                        code: captchaCode
                    },
                    "type":"post",
                    //timeout:1000,
                    success: function(responseData){
                        var errorMsg;
                        if (responseData.success) {
                            code=captchaCode; //设置code信息
                            //构建员工列表
                            renderEmployeeAccounts(responseData.data);
                            //保存员工列表数据
                            enterpriseStore=responseData.data;
                            //跳转到填写详细信息区
                            util.navToView('findpwd-choseuser-tpl','findpwd');
                        }else {
                            switch (responseData.error) {
                                case '001':
                                    errorMsg = "验证码错误";
                                    break;
                                case '002':
                                    errorMsg= "手机或邮箱格式不正确";
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
        }());

        //员工帐号列表
        (function(){
            var sectionEl=$('#findpwd-choseuser-tpl'),
                resetPwdViewEl=$('#findpwd-again-tpl');
            //打开输入新密码view
            sectionEl.on('click','.reset-pwd-l',function(evt){
                var itemEl=$(this).closest('.employee-item'),
                    enterpriseAccount=itemEl.attr('enterpriseaccount');
                //保存员工数据存储
                resetPwdViewEl.data('enterpriseAccount',enterpriseAccount);
                //打开重置密码view
                //清空input value
                $('#findpwd-again-tpl .mobile-code').val("");
                util.navToView('findpwd-again-tpl','findpwd');
                evt.preventDefault();
            }).on('click','.prev-step-l',function(evt){
                util.navToView('user-findpwd-tpl','findpwd');   //返回到第一屏
                evt.preventDefault();
            });
        }());
        //重置密码view
        (function(){
            var sectionEl=$('#findpwd-again-tpl'),
                newPwdEl=$('.new-pwd',sectionEl),   //新密码
                confirmPwdEl=$('.confirm-pwd',sectionEl),   //确认新密码
                mobileCodeEl=$('#user-findpwd-tpl .mobile-code'),  //手机号或邮箱
                successTipEl=$('#findpwd-apv-tpl'); //密码修改成功提示
            sectionEl.on('click','.f-sub',function(){
                var mobileCode= $.trim(mobileCodeEl.val()),
                    newPwd= $.trim(newPwdEl.val()),
                    confirmPwd=$.trim(confirmPwdEl.val()),
                    enterpriseData=getEnterpriseData(sectionEl.data('enterpriseAccount'));
                //先清空error class
                $('.reg-inp-fail',sectionEl).removeClass('reg-inp-fail');

                if (!regexPassword.test(newPwd)) {
                    util.alert('请输入正确格式的密码，以字母数字开头，6-20个字符');
                    newPwdEl.addClass('reg-inp-fail');
                    return;
                }
                if(confirmPwd!==newPwd){
                    util.alert('确认密码和新密码输入不一致');
                    confirmPwdEl.addClass('reg-inp-fail');
                    return;
                }
                util.ajax({
                    url: rootUrl + '/WebReg/ResetPassword',
                    //url: 'http://192.168.0.9/',
                    //url: '../publish/data/success.json',
                    data: {
                        mobileOrEMail: mobileCode,
                        code:code,
                        enterpriseAccount:enterpriseData.enterpriseAccount,
                        employeeID:enterpriseData.employeeID,
                        newPassword:newPwd
                    },
                    "type":"post",
                    //timeout:1000,
                    error:function(){},
                    success: function(responseData){
                        var errorMsg;
                        if (responseData.success) {
                            successTipEl.show();
                            setTimeout(function(){
                                location.href="https://www.fxiaoke.com/login.aspx";
                            },2000);
                        }else {
                            switch (responseData.error) {
                                case '001':
                                    errorMsg = "验证码错误";
                                    break;
                                case '002':
                                    errorMsg= "企业不存在";
                                    break;
                                case '003':
                                    errorMsg= "密码应为6-20个字符组成";
                                    break;
                                case '004':
                                    errorMsg= "员工帐号不存在";
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
            }).on('click','.prev-step-l',function(evt){
                util.navToView('findpwd-choseuser-tpl','findpwd');
                evt.preventDefault();
            });
        }());
    });
}(jQuery,window));
