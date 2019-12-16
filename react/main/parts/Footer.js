const Footer = (props) => {
	return(
		<div id="footer">
			<div className="container container-wide">
				<div id="footer-inner">
					<div id="copyrights-wrap">
						<div id="copyrights">© Site 2019. All Rights Reserved.</div>
					</div>

					<div id="navigation-wrap">
						<a href="/terms" className="navigation-item">Terms of Service</a>
					</div>

				</div>
			</div>
		</div>
	);
}

export default Footer;