const tabs = document.querySelectorAll('.tab');
const webviews = document.querySelectorAll('webview');

tabs.forEach((tab: Element, index: number) => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    tabs.forEach((t: Element) => t.classList.remove('active'));
    // Hide all webviews
    webviews.forEach((w: any) => (w as any).style.visibility = 'hidden');
    // Add active class to clicked tab
    tab.classList.add('active');
    // Show corresponding webview
    (webviews[index] as any).style.visibility = 'visible';
  });
});

// Set initial visibility
webviews.forEach((w: any, i: number) => {
  if (tabs[i].classList.contains('active')) {
    (w as any).style.visibility = 'visible';
  } else {
    (w as any).style.visibility = 'hidden';
  }
});
