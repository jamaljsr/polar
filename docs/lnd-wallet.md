# LND Wallet: Lock, Unlock & Restore

By default, Polar starts every LND node with the `--noseedbackup` flag. LND then creates its wallet automatically, without asking for a password or showing a seed, and the node is ready to use as soon as it starts. That's the quickest setup for most development.

Real LND nodes don't work that way. They start **locked**, need a password to unlock, and give you a 24-word seed when the wallet is created. If you're building something that has to handle that, such as an app that calls the `WalletUnlocker` or `State` services, an unlock screen, or a seed/channel backup recovery flow, you can make a Polar LND node behave like a real one.

> Note: These features are only available for LND nodes. They are not supported for Core Lightning, Eclair or litd nodes.

- [Start a node locked](#start-a-node-locked)
- [Create a new wallet](#create-a-new-wallet)
- [Unlock the wallet](#unlock-the-wallet)
- [Lock a node that already has a wallet](#lock-a-node-that-already-has-a-wallet)
- [Restore a wallet from a seed](#restore-a-wallet-from-a-seed)
- [Connect your app to a locked node](#connect-your-app-to-a-locked-node)
- [Troubleshooting](#troubleshooting)

## Start a node locked

1. Right-click the LND node in the network designer and choose **Advanced Options**. You can also click **Edit Options** on the node's **Actions** tab.
1. In **Docker Startup Command**, delete the `--noseedbackup` line, then click **Save**.
1. Restart the node, or the whole network. Changes to the startup command only apply the next time the container starts.

The node's status changes to **Locked**. In this state:

- **Stop**, **View Logs** and **Launch Terminal** still work.
- An **Unlock** button appears in the node's right-click menu and on its **Actions** tab.
- Anything that needs the wallet, such as opening channels, creating invoices or depositing funds, is unavailable until the node is unlocked.

What you do next depends on whether the node has a wallet yet:

- A **new node** that has never been started has no wallet. Go to [Create a new wallet](#create-a-new-wallet) or [Restore a wallet from a seed](#restore-a-wallet-from-a-seed).
- A node that was **already started with `--noseedbackup`** has a wallet that Polar can't unlock directly. Go to [Lock a node that already has a wallet](#lock-a-node-that-already-has-a-wallet).

## Create a new wallet

1. Click **Unlock** on a locked node that has no wallet. Polar sees that the wallet hasn't been created yet and opens **Initialize Node &lt;name&gt;**, with **Create new wallet** selected.
1. Enter a **Wallet Password** of at least 8 characters. It is pre-filled with `polarpass`.
1. Click **Initialize**.
1. The node's 24-word seed is displayed. **It is only shown this once.** Use **Copy All** to copy it and save it somewhere, because you'll need it to restore this wallet later.
1. Click **Done**. The node finishes starting up and its status changes to **Started**.

## Unlock the wallet

Polar doesn't store your wallet password, so a node without `--noseedbackup` comes back **Locked** every time it starts.

1. Click **Unlock**.
1. Enter the wallet password and click **Unlock**.

The node's status changes to **Started**.

You can also unlock the node outside Polar, for example by running `lncli unlock` in the node's terminal or calling `WalletUnlocker.UnlockWallet` from your own app. Polar keeps checking the wallet state of a locked node every few seconds, so it notices the unlock and updates the node to **Started** on its own.

## Lock a node that already has a wallet

When LND runs with `--noseedbackup`, it creates the wallet itself and encrypts it with **two** default passphrases: `public` for the master public key and `hello` for the private key. The unlock RPC accepts only one password, so neither default works in Polar's **Unlock** dialog.

To fix this, give the wallet a single password of your own with `lncli changepassword`. LND supports this case directly.

1. Remove `--noseedbackup` and restart the node, as in [Start a node locked](#start-a-node-locked). The node shows as **Locked**.
1. Right-click the node and choose **Launch Terminal**.
1. Run:

   ```sh
   lncli changepassword
   ```

1. When asked for the current password, **leave it empty** and press Enter. LND treats an empty current password as a wallet created with `--noseedbackup` and uses both default passphrases for you.
1. Enter your new password, then confirm it:

   ```text
   Input current wallet password:
   Input new wallet password:
   Confirm new wallet password:
   ```

`changepassword` also unlocks the wallet, so you don't need to open the **Unlock** dialog. Polar detects the change and the node goes to **Started**. The node keeps its existing pubkey, funds and channels. From now on, unlock it with your new password each time it starts.

> Note: A wallet created with `--noseedbackup` never shows its seed, and changing the password doesn't reveal it. If you need a seed, add a new LND node, remove `--noseedbackup` before its first start, and [create a new wallet](#create-a-new-wallet).

## Restore a wallet from a seed

You can restore a wallet only onto a node that **doesn't have one yet**, such as a new LND node with `--noseedbackup` removed before its first start.

1. Click **Unlock** on the locked node, then choose **Restore existing wallet**.
1. Enter a **Wallet Password** of at least 8 characters for the restored wallet.
1. Paste the **Seed Phrase**: exactly 24 words, separated by spaces.
1. Optionally, add a **Channel Backup** by dragging a `channel.backup` file onto the upload area, or clicking it to browse for the file.
1. Click **Restore**.

Polar scans the first 2500 addresses of the seed to find on-chain funds, so the node's on-chain balance comes back once it is synced.

### Restoring with a channel backup

A channel backup doesn't reopen channels. When the restored node connects to each peer, it asks that peer to force-close their channel. After the restore, Polar:

1. waits up to 30 seconds for the peers to broadcast their force-close transactions, then
1. mines 1 block to confirm them.

After that, the restored node's side of each channel is still time-locked, so **mine more blocks** until the funds show up in its on-chain balance.

Every LND node keeps its channel backup in its Docker volume, where it's updated whenever a channel opens or closes:

```text
~/.polar/networks/<network-id>/volumes/lnd/<node-name>/data/chain/bitcoin/regtest/channel.backup
```

If the folder `~/.local/share/polar` exists, Polar stores its data there instead of in `~/.polar`.

### Example: simulate losing a node

1. Create a network with two LND nodes, `alice` and `bob`, and a bitcoind node. Before starting it, remove `--noseedbackup` from alice's startup command.
1. Start the network, click **Unlock** on alice, **create a new wallet** and save the seed.
1. Deposit funds into alice and open a channel from alice to bob.
1. Copy alice's `channel.backup` file somewhere outside the network folder.
1. Stop the whole network. Add a new LND node, `carol`, and remove `--noseedbackup` from her startup command. Restart the network.
1. Stop alice so that she and carol aren't online with the same wallet at the same time.
1. Start carol, click **Unlock**, choose **Restore existing wallet**, and enter alice's seed and the copied `channel.backup`.
1. Bob force-closes the channel. Mine blocks until alice's channel balance appears in carol's on-chain balance.

## Connect your app to a locked node

The node's **Connect** tab shows connection details while the node is **Locked**, so you can point your app at it before it is unlocked:

- **Locked with an existing wallet:** the hosts, TLS cert and macaroons are shown. Only the `State` and `WalletUnlocker` services work until the node is unlocked. Every other call fails.
- **No wallet yet:** only the TLS cert path is shown. LND creates the macaroons when the wallet is initialized, so they appear after you create or restore one.

## Troubleshooting

- **"Unable to unlock the wallet" on a node that used to run with `--noseedbackup`**: that wallet has two default passphrases, which the unlock RPC can't use. Follow [Lock a node that already has a wallet](#lock-a-node-that-already-has-a-wallet).
- **"Unable to unlock the wallet" on any other node**: the password is wrong. Polar doesn't store it, so use the password you chose when you created, restored or changed it.
- **"Unable to determine the wallet state"**: Polar couldn't reach the node's `State` service. Click **Retry**. If that fails, check the node's logs.
- **"The seed phrase must contain exactly 24 words"**: check for missing or extra words. Words must be separated by spaces.
- **I added `--noseedbackup` back and the node is stuck "Waiting for LND to come online"**: once a wallet has its own password, LND can't open it with the default passphrases. It exits with `unable to unlock macaroons: invalid password`, and Docker keeps restarting it. After about two minutes the node shows **Error**. To recover, remove `--noseedbackup` again, then start the node. It comes back **Locked**, and you can unlock it with your password.
