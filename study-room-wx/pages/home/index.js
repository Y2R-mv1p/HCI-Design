// import {listHome} from "../../api/home/index"
import pages from "../../pages";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    backgroundSwiper: [
      "https://img.picui.cn/free/2025/05/17/6828152adf844.jpg",
"https://img.picui.cn/free/2025/05/17/6828152b7fc7c.jpg",
"https://img.picui.cn/free/2025/05/17/6828152c8faf3.jpg",
"https://img.picui.cn/free/2025/05/17/6828152e84cae.jpg"
    ],
    //https://s1.ax1x.com/2023/02/01/pSBqEKU.jpg
    // 轮播配置
    indicatorDots: true,
    vertical: false,
    autoplay: true,
    interval: 2000,
    duration: 500,
    // 场地介绍
    journalismList: [
      {
        text: "可学习楼层为二、三、四、六、七层。",
      },
      {
        text: "二、六、七层开放时间为7:30至22:30。",
      },
      {
        text: "三、四层开放时间为7:30至21:30。",
      },
      {
        text: "二、三、四层有插座。",
      },
      {
        text: "线上预约，无需抢座占座。",
      },
      {
        text: "节假日工作时间另行通知。",
      },
    ],
    matter: [
      {
        text: "1.请注意《安徽大学图书馆座位预约办法》。"
      },
      {
        text: "2.原则上需要提前一小时预约。"
      },
      {
        text: "3.预约成功后刷卡进自习场所，如中途需外出，请随身携带校园卡，以便进门。"
      }     
    ]
  },
  regionCheck() {
    wx.navigateTo({
      url: pages.Region
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {},
  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        //唯一标识(防止tab点击两次才生效)
        selected: 0,
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},
});
