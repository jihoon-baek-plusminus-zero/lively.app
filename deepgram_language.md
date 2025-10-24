---
title: Models & Languages Overview
subtitle: An overview of Deepgram's speech-to-text models and supported languages.
slug: docs/models-languages-overview
---

## Models

| General Models                                   | Description & Use                                                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Flux](/docs/models-languages-overview#flux) | Our latest-generation streaming model unifying best-in-class ASR with model-native turn detection. Recommended for real-time agents, customer support bots, and interactive, turn-based experiences. |
| [nova-3](/docs/models-languages-overview#nova-3) | Our highest-performing general-purpose ASR (no turn detection). Recommended for meetings, event captioning, multi-speaker, multilingual, noisy, or far-field audio in batch or streaming.|
| [nova-2](/docs/models-languages-overview#nova-2) | Recommended for use cases with languages not yet supported by nova-3, and filler word identification.                                                                                                      |

<Info>
  All models default to `language=en` unless otherwise specified via the `language` parameter.
</Info>

### Example

To request any Deepgram Model, change `MODEL_OPTION` to the Model you want to use.

<CodeGroup>
  ```curl cURL
  curl \  --request POST \
  --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
  --header 'Content-Type: audio/wav' \
  --data-binary @youraudio.wav \
  --url 'https://api.deepgram.com/v1/listen?model=MODEL_OPTION'
  ```
</CodeGroup>

<Warning>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](/docs/create-additional-api-keys).
</Warning>

## Flux

Flux is the first conversational speech recognition model built specifically for voice agents. Unlike traditional STT that passively transcribed what is said, Flux understands conversational flow and automatically handles turn-taking.

Flux tackles the most critical challenges for voice agents today: knowing when to listen, when to think, and when to speak. The model features first-of-its-kind model-integrated end-of-turn detection, configurable turn-taking dynamics, and ultra-low latency optimized for voice agent pipelines, all with Nova-3 level accuracy.

| Model Option                 | Language                                         |
| ---------------------------- | ------------------------------------------------ |
| `flux-general-en` | English (all accents): `en` |

## Nova-3

Nova-3 represents a significant leap forward in speech AI technology, featuring substantial improvements in accuracy and real-world application capabilities. The model delivers industry-leading performance with a 54.2% reduction in word error rate (WER) for streaming and 47.4% for batch processing compared to competitors.

Nova-3 introduces groundbreaking features including real-time multilingual conversation transcription, enhanced comprehension of domain-specific terminology, and optional personal information redaction. Notably, it's the first voice AI model to offer self-serve customization, enabling instant vocabulary adaptation without model retraining. In multilingual testing, Nova-3 demonstrated superior performance across all seven tested languages, with particularly strong results showing up to 8:1 preference ratios in certain languages.

| Model Option                 | Language                                         |
| ---------------------------- | ------------------------------------------------ |
| `nova-3` or `nova-3-general` | [**Multilingual (English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, and Dutch): `multi`** ](/docs/multilingual-code-switching), <br /> English: `en`, `en-US`, `en-AU`, `en-GB`, `en-IN`, `en-NZ`, <br /> German: `de`, <br /> Dutch: `nl`, <br /> Swedish: `sv`, `sv-SE`, <br /> Danish: `da`, `da-DK`, <br /> Spanish: `es`, `es-419`, <br /> French: `fr`, `fr-CA`, <br /> Portuguese: `pt`, `pt-BR`, `pt-PT`, <br /> Italian: `it`, <br /> Turkish: `tr`, <br /> Norwegian: `no`, <br /> Indonesian: `id`  |
| `nova-3-medical`             | English: `en`, `en-US`, `en-AU`, `en-CA`, `en-GB`, `en-IE`, `en-IN`, `en-NZ`                           |

## Nova-2

Recommended for use cases with non-English transcription, and filler word identification.

| Model Option                 | Language                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nova-2` or `nova-2-general` | [**Multilingual (Spanish + English): `multi`** ](/docs/multilingual-code-switching), <br /> Bulgarian: `bg`, <br /> Catalan: `ca`, <br /> Chinese (Mandarin, Simplified):`zh`, `zh-CN`,`zh-Hans`, <br /> Chinese (Mandarin, Traditional):`zh-TW`,`zh-Hant`, <br /> Chinese (Cantonese, Traditional): `zh-HK`, <br /> Czech: `cs`, <br /> Danish: `da`, `da-DK`, <br /> Dutch: `nl`, <br /> English: `en`, `en-US`, `en-AU`, `en-GB`, `en-NZ`, `en-IN`, <br /> Estonian: `et`, <br /> Finnish: `fi`, <br /> Flemish: `nl-BE`, <br /> French: `fr`, `fr-CA`, <br /> German: `de`, <br /> German (Switzerland): `de-CH`, <br /> Greek: `el`, <br /> Hindi: `hi`, <br /> Hungarian: `hu`, <br /> Indonesian: `id`, <br /> Italian: `it`, <br /> Japanese: `ja`, <br /> Korean: `ko`, `ko-KR`, <br /> Latvian: `lv`, <br /> Lithuanian: `lt`, <br /> Malay: `ms`, <br /> Norwegian: `no`, <br /> Polish: `pl`, <br /> Portuguese: `pt`, `pt-BR`, `pt-PT`, <br /> Romanian: `ro`, <br /> Russian: `ru`, <br /> Slovak: `sk`, <br /> Spanish: `es`, `es-419`, <br /> Swedish: `sv`, `sv-SE`, <br /> Thai: `th`, `th-TH`, <br /> Turkish: `tr`, <br /> Ukrainian: `uk`, <br /> Vietnamese: `vi` |
| `nova-2-meeting`             | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-phonecall`           | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-finance`             | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-conversationalai`    | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-voicemail`           | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-video`               | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-medical`             | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-drivethru`           | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-automotive`          | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-atc`                 | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `nova-2-<CUSTOM>`            | All available                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Legacy Models

### Nova

Nova 1 is the predecessor to Nova-2.

| Model Option             | Language                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `nova` or `nova-general` | English: `en`, `en-US`, `en-AU`, `en-GB`, `en-NZ`, `en-IN` Spanish: `es`, `es-419` Hindi:`hi-Latn` |
| `nova-phonecall`         | English: `en`, `en-US`                                                                             |
| `nova-medical`           | English: `en`, `en-US`                                                                             |
| `nova-<CUSTOM>`          | All available                                                                                      |

### Enhanced

Recommended for lower word error rates than Base, high accuracy timestamps, and use cases that require [keyword boosting](/docs/keywords).

| Model Option                     | Language                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enhanced` or `enhanced-general` | Danish: `da` Dutch: `nl` English: `en`, `en-US` Flemish: `nl` French: `fr` German: `de` Hindi: `hi` Italian: `it` Japanese: `ja` Korean: `ko` Norwegian: `no` Polish: `pl` Portuguese: `pt`, `pt-BR`, `pt-PT` Spanish: `es`, `es-419`, `es-LATAM` Swedish: `sv` Tamasheq: `taq` Tamil: `ta` |
| `enhanced-meeting`               | English: `en`, `en-US`                                                                                                                                                                                                                                                                      |
| `enhanced-phonecall`             | English: `en`, `en-US`                                                                                                                                                                                                                                                                      |
| `enhanced-finance`               | English: `en`, `en-US`                                                                                                                                                                                                                                                                      |
| `enhanced-<CUSTOM>`              | All available                                                                                                                                                                                                                                                                               |

### Base

Recommended for large transcription volumes and high accuracy timestamps.

| Model                    | Language                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base` or `base-general` | Chinese: `zh`, `zh-CN`, `zh-TW` Danish: `da` Dutch: `nl` English: `en`, `en-US` Flemish: `nl` French: `fr`, `fr-CA` German: `de` Hindi: `hi`, `hi-Latn` Indonesian: `id` Italian: `it` Japanese: `ja` Korean: `ko` Norwegian: `no` Polish: `pl` Portuguese: `pt`, `pt-BR`, `pt-PT` Russian: `ru` Spanish: `es`, `es-419`, `es-LATAM` Swedish: `sv` Tamasheq: `taq` Turkish: `tr` Ukrainian: `uk` |
| `base-meeting`           | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-phonecall`         | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-finance`           | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-conversationalai`  | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-voicemail`         | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-video`             | English: `en`, `en-US`                                                                                                                                                                                                                                                                                                                                                                           |
| `base-<CUSTOM>`          | All available                                                                                                                                                                                                                                                                                                                                                                                    |

## Deepgram Whisper Cloud

Whisper models are less scalable than all other Deepgram models due to their inherent model architecture. All non-Whisper models will return results faster and scale to higher load.

Deepgram Whisper Cloud is a fully managed API that gives you access to Deepgram’s version of OpenAI’s Whisper model. Read our guide [Deepgram Whisper Cloud](/docs/deepgram-whisper-cloud) for a deeper dive into this offering.

* Additional rate limits apply to Whisper due to poor scalability.
* Requests to Whisper are limited to 15 concurrent requests with a paid plan and 5 concurrent requests with the pay-as-you-go plan.
* Long audio files are supported up to a maximum of 20 minutes of processing time (the maximum length of the audio depends on the size of the Whisper model).

Deepgram's Whisper Cloud models can be called with the following syntax:

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=whisper
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=whisper-SIZE
  ```
</CodeGroup>

| Model                         | Language                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `whisper-tiny`                | [See available](/docs/deepgram-whisper-cloud#supported-languages) |
| `whisper-base`                | [See available](/docs/deepgram-whisper-cloud#supported-languages) |
| `whisper-small`               | [See available](/docs/deepgram-whisper-cloud#supported-languages) |
| `whisper-medium` OR `whisper` | [See available](/docs/deepgram-whisper-cloud#supported-languages) |
| `whisper-large`               | [See available](/docs/deepgram-whisper-cloud#supported-languages) |

***
---
title: Languages Support
subtitle: An overview of Deepgram's speech-to-text supported languages.
slug: docs/language
---

`language` *string* Default: `en`

<div class="flex flex-row gap-2">
  <span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
   <span class="dg-badge"><span><Icon icon="waveform-lines" /> Streaming</span></span>    
</div>

## Enable Feature

To enable Language in your API request you can add the `language` parameter in the query string and set it to the language you would like to recognize:

`language=OPTION`

<Info>
  For a full list of languages and compatible models see our [Model & Language Overview](/docs/models-languages-overview).
</Info>

To transcribe audio from a file on your computer, run the following curl command in a terminal or your favorite API client.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url 'https://api.deepgram.com/v1/listen?language=OPTION'
  ```
</CodeGroup>

<Warning>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](/docs/create-additional-api-keys).
</Warning>

## Language Restriction Behavior

When a specific language is set using the `language` parameter (e.g., `language=en`), Deepgram will only attempt to transcribe speech in that specified language. Speech in other, non-specified languages will not be transcribed. If you expect your audio to contain multiple languages and want Deepgram to transcribe across them, consider using `language=multi` with one of our [multilingual models](/docs/multilingual-code-switching).

## Results

Once the language option is applied, results will appear in the transcript.

## English Dialect Spelling

Deepgram's English models are designed to handle global English audio, with strong performance across dialects and accents from across the world. Transcription outputs from the English models are provided with standardized American spelling of words.

For example, "color" will always be spelled as such with both `language=en-US` and `language=en-GB`, never using the British spelling "colour". If your use case requires a different spelling, you should perform post-processing on results in order to enforce your preferred spelling standard.

***
---
title: Language Detection
subtitle: Language Detection identifies the dominant language spoken in submitted audio.
slug: docs/language-detection
---


`detect_language` *boolean* Default: `false`

<div class="flex flex-row gap-2">
  <span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
   <span class="dg-badge unavailable strike-through"><span><Icon icon="waveform-lines" /> Streaming</span></span>
 
</div>

Deepgram’s Language Detection feature identifies the dominant language spoken in submitted audio, transcribes the audio in the identified language, and returns the detected language code in the JSON response.

<Info>
  If you need to process multiple languages for real-time streaming, we recommend using Deepgram's [Nova-2](./models-languages-overview#nova-2) or [Nova-3](./models-languages-overview#nova-3) multilingual models.
</Info>

If you are submitting multichannel audio, Language Detection identifies one language per channel. Language Detection is supported for the following languages:

* Spanish - `es`
* English - `en`
* Hindi - `hi`
* Japanese - `ja`
* Russian - `ru`
* Ukrainian - `uk`
* Swedish - `sv`
* Chinese - `zh`
* Portuguese - `pt`
* Dutch - `nl`
* Turkish - `tr`
* French - `fr`
* German - `de`
* Indonesian - `id`
* Korean - `ko`
* Italian - `it`

## Enable Feature

To enable Language Detection, when you call Deepgram’s API, add a `detect_language` parameter set to `true` in the query string:

`detect_language=true`

To transcribe audio from a file on your computer, run the following cURL command in a terminal or your favorite API client.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url 'https://api.deepgram.com/v1/listen?model=nova-3-general&detect_language=true'
  ```
</CodeGroup>

<Warning>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](https://console.deepgram.com/signup?jump=keys).
</Warning>

## Analyze Response

When the file is finished processing (often after only a few seconds), you’ll receive a JSON response that has the following basic structure:

<CodeGroup>
  ```json JSON
  {
    "metadata": {
      "transaction_key": "string",
      "request_id": "string",
      "sha256": "string",
      "created": "string",
      "duration": 0,
      "channels": 0
    },
    "results": {
      "channels": [
        {
          "alternatives":[],
          "detected_language": "fr",
          "language_confidence": 0.0
        }
      ]
    }
  ```
</CodeGroup>

In this response, we see that each channel contains:

* `alternatives` object, which contains:

  * `transcript`: Transcript for the audio being processed.
  * `confidence`: Floating point value between 0 and 1 that indicates overall transcript reliability. Larger values indicate higher confidence.
  * `words`: Object containing each word in the transcript, along with its start time and end time (in seconds) from the beginning of the audio stream, a word confidence value, a speaker identifier, and a speaker confidence value.

* `detected_language`: [BCP-47](https://tools.ietf.org/html/bcp47) language tag for the dominant language identified in the channel.

* `language_confidence`: Floating point value between 0 and 1 that indicates the confidence of the language selection (see below for important details). `language_confidence` is not supported for Whisper models and will not be included in the API response for Whisper requests.

## Advanced Functionality

### Model Selection

If you specify both `detect_language=true` and a `model` in your query parameter, Deepgram will attempt to use the specified model for the language that is detected. However, if the detected language is not available for that model, Deepgram will automatically select the next highest model to complete the request.

To use the best Deepgram model available, use `model=nova-3-general&detect_language=true`. The order of precedence  will be: `Nova-3 -> Nova-2 -> Nova-1 -> Enhanced -> Base`.

For example, you may send a request with the parameters `detect_language=true&model=nova-3-general`. If the detected language is supported by Base and Enhanced models, but not a Nova-3 model, Deepgram will process the request with the Enhanced model since that is the next highest model available for that language.

### Interaction with `language` query parameter

If the `language` parameter is set with a language option and `detect_language` is set to `true`, language detection will override the `language` option specified.

### Restricting the detectable languages

You can also restrict the set of detectable languages. This is useful if when you know your audio files only contain English or Spanish audio. To restrict the set of detectable languages, use a multi-valued query parameter with the language codes as the values.

For example, `detect_language=en&detect_language=es` will choose either English or Spanish as the detected language.

### How to use `language_confidence`

<Warning>
  `language_confidence` is not supported when using Whisper models.
</Warning>

Deepgram outputs a `language_confidence` score that ranges between 0 and 1 with higher values indicating more confidence in the selected language.

The `language_confidence` score can be used as a metric to determine whether the transcript is accurate. For example, if the `language_confidence` falls below a certain threshold, you may want to default to another language or reject the transcript.

It is critical to know that the `language_confidence` score only takes into account the 16 supported languages. If the audio is in a language not supported by language detection, the value of `language_confidence` should be ignored.

## Streaming and Multilingual Alternatives

Language Detection is not currently supported for streaming. If you need to handle multiple languages in a real-time streaming context, we recommend using Deepgram's [Nova-2](./models-languages-overview#nova-2) or [Nova-3](./models-languages-overview#nova-3) multilingual models instead.

These models can transcribe speech containing multiple languages within the same audio stream without requiring explicit language detection, making them ideal for streaming applications where language detection functionality is needed.


***
What's Next

[Multilingual Codeswitching](https://developers.deepgram.com/docs/multilingual-code-switching).
---
title: Multilingual Codeswitching
subtitle: Transcribe conversations where speakers switch between multiple languages.
slug: docs/multilingual-code-switching
---

`language` *string* Option: `multi`

<div class="flex flex-row gap-2">
  <span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
   <span class="dg-badge"><span><Icon icon="waveform-lines" /> Streaming</span></span>     <span class="dg-badge pink"><span><Icon icon="language" /> Specific languages only</span></span>
 
</div>

The Multilingual Codeswitching feature in Deepgram's API allows you to transcribe conversations where speakers switch between multiple languages. This guide will walk you through enabling this feature, how to use it with cURL, and how to analyze and interpret the response.

<Info>
  Multilingual Code Switching is only available when using the Nova-2 or Nova-3 models. See [the list of supported languages](/docs/models-languages-overview#nova-3) for each multilingual model.
</Info>


## 1. Enable Feature

To enable Multilingual Codeswitching, use the following language parameter in the query string when you call Deepgram’s `/listen` endpoint :

`language=multi`

### Pre-Recorded Audio

To transcribe audio from a file on your computer that contains multiple languages, run the following cURL command in a terminal or your favorite API client.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url 'https://api.deepgram.com/v1/listen?language=multi&model=nova-3
  ```
</CodeGroup>

<Warning>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](/docs/create-additional-api-keys).
</Warning>

### Streaming Audio

To transcribe an audio stream, initiate a websocket connection, including the parameter `language=multi`. For instance:

<Info>
  We recommend using an endpointing value of 100 ms for code-switching, `endpointing=100`.
</Info>

```
wss://api.deepgram.com/v1/listen?language=multi&model=nova-3&sample_rate=44100&encoding=linear16&endpointing=100
```

## 3. Analyze Response

### Pre-Recorded Audio

When the file is finished processing, you’ll receive a JSON response that has the following basic structure:

<CodeGroup>
  ```json JSON

  {
      "metadata": {
          "transaction_key": "deprecated",
          "request_id": "2479c8c8-8285-40ac-9ab6-f0874449f793",
          "sha256": "154e291ecfa8be6ab8343560bcc109001fa7853eb537253be8e4defc9b504c33",
          "created": "2024-06-26T19:56:16.180Z",
          "duration": 1.6,
          "channels": 1,
          "models": [
              "dc8a3fe5-a395-4b75-a8b1-71c9a5a87526"
          ],
          "model_info": {
              "dc8a3fe5-a395-4b75-a8b1-71c9a5a87526": {
                  "name": "2-general-nova",
                  "version": "1999-06-13.21385",
                  "arch": "nova-2"
              }
          }
      },
      "results": {
          "channels": [
              {
                  "alternatives": [
                      {
                          "transcript": "No recuerdo mi bank password.",
                          "confidence": 0.99902344,
                          "languages": [
                              "en",
                              "es"
                          ],
                          "words": [
                              {
                                  "word": "no",
                                  "start": 0.08,
                                  "end": 0.32,
                                  "confidence": 0.9975586,
                                  "language": "es"
                              },
                              {
                                  "word": "recuerdo",
                                  "start": 0.32,
                                  "end": 0.79999995,
                                  "confidence": 0.9921875,
                                  "language": "es"
                              },
                              {
                                  "word": "mi",
                                  "start": 0.79999995,
                                  "end": 1.04,
                                  "confidence": 0.96777344,
                                  "language": "es"
                              },
                              {
                                  "word": "bank",
                                  "start": 1.04,
                                  "end": 1.28,
                                  "confidence": 1,
                                  "language": "en"
                              },
                              {
                                  "word": "password",
                                  "start": 1.28,
                                  "end": 1.5999999,
                                  "confidence": 0.9926758,
                                  "language": "en"
                              }
                          ]
                      }
                  ]
              }
          ]
      }
  }
  ```
</CodeGroup>

In this response, we see that each channel contains:

* **alternatives** object, which contains:

  * **transcript**: Transcript for the audio being processed.
  * **confidence**: Floating point value between 0 and 1 that indicates overall transcript reliability. Larger values indicate higher confidence.
  * **languages**: Array of [BCP-47](https://tools.ietf.org/html/bcp47) language tags for all detected languages in the channel, sorted in descending order of number of words per language.
  * **words**: Object containing each word in the transcript, along with its start time and end time (in seconds) from the beginning of the audio, a word-level transcription confidence value, the language of the word, and the punctuated word if Smart Formatting is enabled.

### Streaming Audio

When streaming audio, a Results JSON message has the following structure:

<CodeGroup>
  ```json JSON
  {
      "type": "Results",
      "channel_index": [
          0,
          1
      ],
      "duration": 4.0700073,
      "start": 464.47,
      "is_final": True,
      "speech_final": False,
      "channel": {
          "alternatives": [
              {
                  "transcript": "será el inglés muchos",
                  "confidence": 0.937473,
                  "languages": [
                      "es"
                  ],
                  "words": [
                      {
                          "word": "será",
                          "start": 465.43,
                          "end": 465.91,
                          "confidence": 0.9494371,
                          "language": "es"
                      },
                      {
                          "word": "el",
                          "start": 465.91,
                          "end": 466.15,
                          "confidence": 0.37035784,
                          "language": "es"
                      },
                      {
                          "word": "inglés",
                          "start": 466.15,
                          "end": 466.65,
                          "confidence": 0.416623,
                          "language": "es"
                      },
                      {
                          "word": "muchos",
                          "start": 467.75,
                          "end": 468.25,
                          "confidence": 0.937473,
                          "language": "es"
                      }
                  ]
              }
          ]
      },
      "metadata": {
          "request_id": "84157495-6794-4c45-b12b-95b0aeb8793f",
          "model_info": {
              "name": "2-general-nova",
              "version": "1999-05-16.19331",
              "arch": "nova-2"
          },
          "model_uuid": "cf62fbcf-2ee4-49ff-a064-d92fc81d27f4"
      },
      "from_finalize": False
  }
  ```
</CodeGroup>

***
---
title: Model Options
subtitle: Model options allows you to supply a model to use for speech-to-text.
slug: docs/model
---

`model` *string* Default: `base-general`

<div class="flex flex-row gap-2">
  <span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
   <span class="dg-badge"><span><Icon icon="waveform-lines" /> Streaming</span></span>     <span class="dg-badge"><span><Icon icon="stream" />Flux</span></span>
 
</div>

Deepgram’s Model feature allows you to supply a model to use when processing submitted audio. To learn more about the pricing for our different models, see [Deepgram Pricing & Plans](https://deepgram.com/pricing/).

## Models & Model Options

Below are a list of all model and model options that can be used with the Deepgram API.

### Flux

**Examples**

```
https://api.deepgram.com/v2/listen?model=flux-general-en
```

Flux is the first conversational speech recognition model built specifically for voice agents. Unlike traditional STT that just transcribes words, Flux understands conversational flow and automatically handles turn-taking. Flux tackles the most critical challenges for voice agents today: knowing when to listen, when to think, and when to speak. The model features first-of-its-kind model-integrated end-of-turn detection, configurable turn-taking dynamics, and ultra-low latency optimized for voice agent pipelines, all with Nova-3 level accuracy.

### Nova-3

**Examples**

```
https://api.deepgram.com/v1/listen?model=nova-3
```

Nova-3 represents a significant leap forward in speech AI technology, featuring substantial improvements in accuracy and real-world application capabilities. The model delivers industry-leading performance with a 53.4% reduction in word error rate (WER) for streaming and 47.4% for batch processing compared to competitors. Nova-3 introduces groundbreaking features including real-time multilingual conversation transcription, enhanced comprehension of domain-specific terminology, and optional personal information redaction. Notably, it's the first voice AI model to offer self-serve customization, enabling instant vocabulary adaptation without model retraining. In multilingual testing, Nova-3 demonstrated superior performance across all seven tested languages, with particularly strong results showing up to 8:1 preference ratios in certain languages.

<Info>
  Nova-3 has the following model options which can be called by using the following syntax: `model=nova-3-{option}`
</Info>

* `general`: Optimized for everyday audio processing.
* `medical`: Optimized for audio with medical oriented vocabulary.

### Nova-2

**Examples**

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=nova-2
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=nova-2-phonecall
  ```
</CodeGroup>

Nova-2 expands on Nova-1's advancements with speech-specific optimizations to the underlying Transformer architecture, advanced data curation techniques, and a multi-stage training methodology. These changes yield reduced word error rate (WER) and enhancements to entity recognition (i.e. proper nouns, alphanumerics, etc.), punctuation, and capitalization.

<Info>
  Nova-2 has the following model options which can be called by using the following syntax: `model=nova-2-{option}`
</Info>

* `general`: Optimized for everyday audio processing.
* `meeting`: Optimized for conference room settings, which include multiple speakers with a single microphone.
* `phonecall`: Optimized for low-bandwidth audio phone calls.
* `voicemail`: Optimized for low-bandwidth audio clips with a single speaker. Derived from the phonecall model.
* `finance`: Optimized for multiple speakers with varying audio quality, such as might be found on a typical earnings call. Vocabulary is heavily finance oriented.
* `conversationalai`: Optimized for use cases in which a human is talking to an automated bot, such as IVR, a voice assistant, or an automated kiosk.
* `video`: Optimized for audio sourced from videos.
* `medical`: Optimized for audio with medical oriented vocabulary.
* `drivethru`: Optimized for audio sources from drivethrus.
* `automotive`: Optimized for audio with automative oriented vocabulary.
* `atc`: Optimized for audio from air traffic control.

### Nova

**Examples**

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=nova
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=nova-phonecall
  ```
</CodeGroup>

Nova is the predecessor to Nova-2. Training on this model spans over 100 domains and 47 billion tokens, making it the deepest-trained automatic speech recognition (ASR) model to date. Nova doesn't just excel in one specific domain — it is ideal for a wide array of voice applications that require high accuracy in diverse contexts.

<Info>
  Nova has the following model options which can be called by using the following syntax: `model=nova-{option}`
</Info>

* `general`: Optimized for everyday audio processing. Likely to be more accurate than any region-specific Base model for the language for which it is enabled. If you aren't sure which model to select, start here.

* `phonecall`: Optimized for low-bandwidth audio phone calls.

### Enhanced

**Examples**

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=enhanced
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=enhanced-phonecall
  ```
</CodeGroup>

Enhanced models are still some of our most powerful speech-to-text models; they generally have higher accuracy and better word recognition than our base models, and they handle uncommon words significantly better.

<Info>
  Enhanced has the following model options which can be called by using the following syntax: `model=enhanced-{option}`
</Info>

* `general`: Optimized for everyday audio processing. Likely to be more accurate than any region-specific Base model for the language for which it is enabled. If you aren't sure which model to select, start here.

* `meeting` *beta*: Optimized for conference room settings, which include multiple speakers with a single microphone.

* `phonecall`: Optimized for low-bandwidth audio phone calls.

* `finance` *beta*: Optimized for multiple speakers with varying audio quality, such as might be found on a typical earnings call. Vocabulary is heavily finance oriented.

The Enhanced models can be called with the following syntax:

### Base

**Examples**

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=base
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=base-phonecall
  ```
</CodeGroup>

Base models are built on our signature end-to-end deep learning speech-to-text model architecture. They offer a solid combination of accuracy and cost effectiveness in some cases.

<Info>
  Base has the following model options which can be called by using the following syntax: `model=base-{option}`
</Info>

* `general`: (Default) Optimized for everyday audio processing.
* `meeting`: Optimized for conference room settings, which include multiple speakers with a single microphone.
* `phonecall`: Optimized for low-bandwidth audio phone calls.
* `voicemail`: Optimized for low-bandwidth audio clips with a single speaker. Derived from the phonecall model.
* `finance`: Optimized for multiple speakers with varying audio quality, such as might be found on a typical earnings call. Vocabulary is heavily finance oriented.
* `conversationalai`: Optimized for use cases in which a human is talking to an automated bot, such as IVR, a voice assistant, or an automated kiosk.
* `video`: Optimized for audio sourced from videos.

### Custom

You may also use a custom, trained model associated with your account by including its `custom_id`.

<Info>
  Custom models are only available to Enterprise customers. See [Deepgram Pricing & Plans](https://deepgram.com/pricing/) for more details.
</Info>

### Whisper

**Examples**

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=whisper
  ```
</CodeGroup>

<CodeGroup>
  ```text Text
  https://api.deepgram.com/v1/listen?model=whisper-SIZE
  ```
</CodeGroup>

<Warning>
  Whisper models are less scalable than all other Deepgram models due to their inherent model architecture. All non-Whisper models will return results faster and scale to higher load.
</Warning>

Deepgram's Whisper Cloud is a fully managed API that gives you access to Deepgram's version of OpenAI’s Whisper model. Read our guide [Deepgram Whisper Cloud](/docs/deepgram-whisper-cloud) for a deeper dive into this offering.

Deepgram's Whisper models have the following size options:

* `tiny`: Contains 39 M parameters. The smallest model available.
* `base`: Contains 74 M parameters.
* `small`: Contains 244 M parameters.
* `medium`: Contains 769 M parameters. The default model if you don't specify a size.
* `large`: Contains 1550 M parameters. The largest model available. Defaults to OpenAI’s Whisper large-v2.

<Warning>
  Additional rate limits apply to Whisper due to poor scalability. Requests to Whisper are limited to 15 concurrent requests with a paid plan and 5 concurrent requests with the pay-as-you-go plan. Long audio files are supported up to a maximum of 20 minutes of processing time (the maximum length of the audio depends on the size of the Whisper model).
</Warning>

## Try it out

To transcribe audio from a file on your computer using a particular model, run the following curl command in a terminal or your favorite API client.

<CodeGroup>
  ```bash CURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url 'https://api.deepgram.com/v1/listen?model=OPTION'
  ```
</CodeGroup>

<Info>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](https://console.deepgram.com/signup?jump=keys).
</Info>

***
---
title: Version
subtitle: >-
  Version allows you to specify the version of the model you want to use to
  process your submitted audio.
slug: docs/version
---

`version` *string* Default: `latest`

<div class="flex flex-row gap-2">
<span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
 <span class="dg-badge"><span><Icon icon="waveform-lines" /> Streaming</span></span>     <span class="dg-badge"><span><Icon icon="stream" />Flux</span></span>
 
</div>

Deepgram’s Version feature allows you to specify the version of the model you want to use to process your submitted audio.

## Enable Feature

To enable Version, when you call Deepgram’s API, add a `version` parameter in the query string and set it to the version of the model you want to use to process your submitted audio.

`version=MODEL_VERSION`

## Use the Latest Version

To use the latest version of your selected model, send `latest` in the `version` parameter:

`version=latest`

## Use an Earlier Version of a Standard Model

To use an earlier version of a selected Deepgram standard model, send the version number in the `version` parameter:

`version=VERSION_NUMBER`

**Example:** `version=2021-03-17.0`

You can locate version numbers of Deepgram standard models in [our changelog](https://deepgram.com/changelog/). Select **Speech Model** to filter the updates.

## Use a Specific Version of a Custom Trained Model

To use a specific version of a custom model associated with your account, send the custom model's `version_id` in the `version` parameter:

`version=VERSION_ID`

**Example:** `version=12345678-1234-1234-1234-1234567890ab`

## Get Early Access to an Updated Standard Model

When we release updated versions of Deepgram standard models, you may be able to try them out and provide feedback. To do so, send the version name of the selected model in the `version` parameter:

`version=VERSION_NAME`

**Example:** `version=beta`

To learn about updated model availability and get relevant version names, [contact Support](/support).

## When to use Versions

* If you want to make sure you are using the latest version of a Deepgram model.
* If you want to use an earlier version of a Deepgram model.
* If you want to use a specific version of a custom Deepgram model.
