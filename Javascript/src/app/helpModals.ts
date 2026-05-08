export function wireHelpModals(): void {
	document.querySelectorAll(".help-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const targetId = btn.getAttribute("data-help-target");
			if (!targetId) return;

			const modalElement = document.getElementById(targetId);
			if (modalElement && window.bootstrap) {
				const modal = new window.bootstrap.Modal(modalElement);
				modal.show();
			}
		});
	});
}
