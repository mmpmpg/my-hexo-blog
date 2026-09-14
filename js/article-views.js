document.addEventListener("DOMContentLoaded", async function () {
  // 只在文章页运行
  const article = document.querySelector("article.post-content");
  if (!article) return;

  // Fluid 文章顶部：字数、阅读时间所在区域
  const metaContainer = document.querySelector(
    "#banner .banner-text .mt-1"
  );

  if (!metaContainer) return;

  // 防止重复插入
  if (document.getElementById("article-view-count")) return;

  const viewElement = document.createElement("span");
  viewElement.id = "article-view-count";
  viewElement.className = "post-meta mr-2";
  viewElement.textContent = "阅读 --";

  metaContainer.appendChild(viewElement);

  const api = "https://views.698611.xyz/view";

  // pathname 在浏览器里可能是 URL 编码后的中文
  // 统一还原成中文路径后发送给 D1
  let path;

  try {
    path = decodeURIComponent(window.location.pathname);
  } catch (e) {
    path = window.location.pathname;
  }

  if (!path.endsWith("/")) {
    path += "/";
  }

  // 本地 Hexo 预览不增加正式阅读量
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // 同一次浏览器会话中，同一篇文章只计数一次
  const storageKey = "article-viewed:" + path;
  const alreadyViewed = sessionStorage.getItem(storageKey) === "1";

  try {
    let response;

    if (!isLocal && !alreadyViewed) {
      // 第一次打开文章：阅读量 +1
      response = await fetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: path
        })
      });
    } else {
      // 已统计过，或者本地预览：只查询，不增加
      response = await fetch(
        api + "?path=" + encodeURIComponent(path),
        {
          method: "GET"
        }
      );
    }

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (typeof data.views === "number") {
      viewElement.textContent = "阅读 " + data.views;

      // 只有正式站点的 POST 成功后才记录
      if (!isLocal && !alreadyViewed) {
        sessionStorage.setItem(storageKey, "1");
      }
    }
  } catch (error) {
    console.error("Failed to load article views:", error);

    // 请求失败时不显示错误数字
    viewElement.style.display = "none";
  }
});