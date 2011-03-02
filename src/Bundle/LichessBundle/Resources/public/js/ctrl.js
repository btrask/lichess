$(function() {
	if ($game = $('div.lichess_game').orNot()) {
		$game.game(lichess_data);
		$('input').click(function() {
			this.select();
		});
		if (!lichess_data.player.spectator) $('a.blank_if_play').attr('target', '_blank');
	}
	$nbConnectedPlayers = $nbConnectedPlayers = $('#nb_connected_players').orNot();
	if ($userTag = $('#user_tag').orNot()) {
		function onlinePing() {
			setTimeout(function() {
				$.get($userTag.attr('data-online-url'), function(data) {
					showNbConnectedPlayers(data.nbp);
					if (typeof data.nbm != 'undefined') {
						$('#nb_messages').text(data.nbm).toggleClass('unread', data.nbm > 0);
					}
					onlinePing();
				},
				"json");
			},
			5000);
		};
		onlinePing();
	}
	else if ($nbConnectedPlayers) {
		function reloadNbConnectedPlayers() {
			setTimeout(function() {
				$.get($nbConnectedPlayers.attr('data-url'), function(nb) {
					$nbConnectedPlayers.text($nbConnectedPlayers.text().replace(/\d+/, nb));
					reloadNbConnectedPlayers();
				});
			},
			5000);
		};
		reloadNbConnectedPlayers();
	}

	function showNbConnectedPlayers(nb) {
		if ($nbConnectedPlayers) $nbConnectedPlayers.text($nbConnectedPlayers.text().replace(/\d+/, nb));
	}

	if ($config = $('div.game_config_form').orNot()) {
		$('div.lichess_overboard').show();
        $config.find('div.buttons').buttonset().disableSelection();
        $config.find('button.submit').button().disableSelection();
		$config.find('a.show_advanced').one('click', function() {
			$(this).hide();
			$config.find('div.advanced, p.explanations').show();
			centerOverboard();
		});
	}

	if ($overboard = $('div.lichess_overboard').orNot()) {
		var centerOverboard = function() {
			$overboard.css('top', (238 - $overboard.height() / 2) + 'px').show();
		};
		centerOverboard();
	}

	// Append marks 1-8 && a-h
	if ($bw = $('div.lichess_board_wrap').orNot()) {
		$.displayBoardMarks($bw, $('#lichess > div.lichess_player_white').length);
	}

	$('div.lichess_language').hover(function() {
		ul = $(this).find('ul');
		if (!ul.length) {
			var $div = $(this);
			$.get($div.attr('data-path'), function(html) {
				$div.append(html).find('ul').fadeIn(300);
			});
		} else {
			ul.fadeIn(300);
		}
	},
	function() {
		$(this).find('ul').fadeOut(300);
	});

	$('.js_email').text(['thibault.', 'duplessis@', 'gmail.com'].join(''));

	$.fn.tipsy && $('a, input, label, div.lichess_server').not('.notipsy').tipsy({
		fade: true
	});

	if ($autocomplete = $('input.autocomplete').orNot()) {
		$autocomplete.autocomplete({
			source: $autocomplete.attr('data-provider'),
			minLength: 2,
			delay: 100
		});
	}

	$('a.toggle_signin').one('click', function() {
		$('#top_menu').find('a.toggle_signin').hide().closest('div.security').addClass('show_signin_form').find('input:first').focus();
	});

	$('#lichess_message input[value=""]:first, #fos_user_user_form_username').focus();

	$('#lichess_translation_form_code').change(function() {
		if ("0" != $(this).val()) {
			location.href = $(this).closest('form').attr('data-change-url').replace(/__/, $(this).val());
		}
	});

	$('#incomplete_translation a.close').one('click', function() {
		$(this).parent().remove();
	});

	var elem = document.createElement('audio');
	var canPlayAudio = !! elem.canPlayType && elem.canPlayType('audio/ogg; codecs="vorbis"');

	$.playSound = function() {
		if (canPlayAudio && 'on' == $('body').attr('data-sound-enabled')) {
			var sound = $('#lichess_sound_player').get(0);
			sound.play();
			setTimeout(function() {
				sound.pause();
			},
			1000);
		}
	}

	if (canPlayAudio) {
		$('body').append($('<audio id="lichess_sound_player">').attr('src', $('body').attr('data-sound-file')));
		$('#sound_state').click(function() {
			var $toggler = $(this);
			$.post($toggler.attr('href'), {},
			function(data) {
				$toggler.attr('class', 'sound_state_' + data);
				$('body').attr('data-sound-enabled', data);
				$.playSound();
			});
			return false;
		});
		$game && $game.trigger('lichess.audio_ready');
	} else {
		$('#sound_state').addClass('unavailable');
		if ($('a.lichess_table_not_started').length) {
			$('div.lichess_goodies_wrap').append('<br />Your browser does not support latest HTML5 features, please consider upgrading.<br /><a href="http://getfirefox.com" target="_blank"><img src="http://sfx-images.mozilla.org/firefox/3.6/96x31_edit_green.png" width="96" height="31" /></a>');
		}
	}

	if (document.domain == 'lichess.org') {
		setTimeout(function() {
			// share links
			$('ul.lichess_social').html('<li class="lichess_stumbleupon"><iframe src="http://www.stumbleupon.com/badge/embed/2/?url=http://lichess.org/"></iframe></li><li class="lichess_facebook"><iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Flichess.org%2F&amp;layout=button_count&amp;show_faces=false&amp;width=110&amp;action=like&amp;font=lucida+grande&amp;colorscheme=light&amp;height=22"></iframe></li>');
		},
		800);
	}
});

jQuery.fn.orNot = function() {
	return this.length == 0 ? false: this;
};

$.displayBoardMarks = function($board, isWhite) {
	if (isWhite) {
		factor = 1;
		base = 0;
	} else {
		factor = - 1;
		base = 575;
	}
	$board.find('span.lichess_mark').remove();
	letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	for (i = 1; i < 9; i++) {
		$board.append($('<span>').addClass('lichess_mark').text(i).css({
			'right': - 10,
			'bottom': factor * i * 64 - 38 + base
		}));
		$board.append($('<span>').addClass('lichess_mark').text(letters[i - 1]).css({
			'bottom': - 14,
			'left': factor * i * 64 - 35 + base
		}));
	}
};

if (document.domain == 'lichess.org') {
	//analytics
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-7935029-3']);
	_gaq.push(['_trackPageview']);
	(function() {
		var ga = document.createElement('script');
		ga.type = 'text/javascript';
		ga.async = true;
		ga.src = 'http://www.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0];
		s.parentNode.insertBefore(ga, s);
	})();
}
