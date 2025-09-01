const tabs = document.querySelectorAll('.tab');
const webviews = document.querySelectorAll('webview');

tabs.forEach((tab: Element, index: number) => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and webviews
    tabs.forEach((t: Element) => t.classList.remove('active'));
    webviews.forEach((w: any) => w.classList.remove('active'));

    // Add active class to clicked tab and corresponding webview
    tab.classList.add('active');
    (webviews[index] as any).classList.add('active');
  });
});
