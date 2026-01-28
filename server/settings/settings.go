// Package settings provides server-side settings management.
package settings

type Settings struct{}

func Default() Settings {
	return Settings{}
}
