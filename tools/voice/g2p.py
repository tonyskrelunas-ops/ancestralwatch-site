"""espeak g2p, in-process — the exact grapheme-to-phoneme Kokoro uses."""
import espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
import phonemizer
_B = phonemizer.backend.EspeakBackend(language='en-us', preserve_punctuation=True, with_stress=True)
def phon(items):
    return [p.strip() for p in _B.phonemize(list(items))]
